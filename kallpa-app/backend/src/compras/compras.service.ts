import { BadRequestException, Injectable } from '@nestjs/common';
import { BitacoraService } from '../bitacora/bitacora.service';
import { aMil, avanzarContrato, moverStock, redondear } from '../common/flujo';
import { EstadoContrato, EstadoSolicitud } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CrearCompraDto } from './compras.dto';

const COMPRABLE: EstadoSolicitud[] = [
  EstadoSolicitud.APROBADA, EstadoSolicitud.EN_COMPRA, EstadoSolicitud.ENTREGADA_PARCIAL,
];

@Injectable()
export class ComprasService {
  constructor(private readonly prisma: PrismaService, private readonly bitacora: BitacoraService) {}

  listar(filtro: { solicitudId?: string; proveedorId?: string }) {
    return this.prisma.compra.findMany({
      where: filtro,
      orderBy: { fechaHora: 'desc' },
      take: 300,
      include: {
        proveedor: { select: { id: true, razonSocial: true } },
        compradoPor: { select: { nombre: true } },
        solicitud: { select: { id: true, folio: true, contrato: { select: { codigo: true } } } },
        items: { include: { solicitudItem: { include: { insumo: { select: { nombre: true } } } }, unidad: true } },
      },
    });
  }

  /**
   * Registra la compra, la suma al almacén (kardex: ENTRADA/COMPRA), guarda el precio
   * en el historial del proveedor y pasa solicitud y contrato a EN_COMPRA.
   */
  async crear(dto: CrearCompraDto, autorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const solicitud = await tx.solicitudInsumos.findUnique({
        where: { id: dto.solicitudId },
        include: { items: { include: { unidad: true, insumo: { include: { unidadBase: true } } } } },
      });
      if (!solicitud) throw new BadRequestException('La solicitud no existe');
      if (!COMPRABLE.includes(solicitud.estado)) {
        throw new BadRequestException(`No se puede comprar sobre una solicitud ${solicitud.estado} (debe estar aprobada)`);
      }
      const proveedor = await tx.proveedor.findUnique({ where: { id: dto.proveedorId } });
      if (!proveedor) throw new BadRequestException('El proveedor no existe');

      const mapa = new Map(solicitud.items.map((i) => [i.id, i]));
      const filas = dto.items.map((it) => {
        const si = mapa.get(it.solicitudItemId);
        if (!si) throw new BadRequestException('Un ítem no pertenece a la solicitud');
        return { it, si, subtotal: redondear(it.cantidad * it.precioUnitario) };
      });
      const total = redondear(filas.reduce((s, f) => s + f.subtotal, 0));

      const compra = await tx.compra.create({
        data: {
          solicitudId: solicitud.id,
          proveedorId: proveedor.id,
          compradoPorId: autorId,
          total,
          tipoComprobante: dto.tipoComprobante,
          comprobanteUrl: dto.comprobanteUrl?.trim() || null,
          items: {
            create: filas.map(({ it, si, subtotal }) => ({
              solicitudItemId: si.id,
              cantidad: it.cantidad,
              unidadCodigo: si.unidadCodigo,
              precioUnitario: it.precioUnitario,
              subtotal,
              marcaComprada: it.marcaComprada?.trim() || null,
              justificacion: it.justificacion?.trim() || null,
            })),
          },
        },
      });

      for (const { it, si } of filas) {
        const factor = (Number(si.unidad.factorBase) || 1) / (Number(si.insumo.unidadBase.factorBase) || 1);
        const enBase = aMil(it.cantidad * factor);
        const precioBase = enBase > 0 ? (it.cantidad * it.precioUnitario) / enBase : 0;
        await moverStock(tx, {
          insumoId: si.insumoId, cantidad: enBase, tipo: 'ENTRADA', motivo: 'COMPRA',
          costoUnitario: Math.round(precioBase * 10000) / 10000, contratoId: solicitud.contratoId,
          referenciaTipo: 'COMPRA', referenciaId: compra.id, usuarioId: autorId,
          observacion: `Compra a ${proveedor.razonSocial}`,
        });
        if (precioBase > 0) {
          await tx.proveedorInsumo.create({
            data: { proveedorId: proveedor.id, insumoId: si.insumoId, precioUnitario: Math.max(0.01, redondear(precioBase)) },
          });
        }
      }

      if (solicitud.estado === EstadoSolicitud.APROBADA) {
        await tx.solicitudInsumos.update({ where: { id: solicitud.id }, data: { estado: EstadoSolicitud.EN_COMPRA } });
      }
      await avanzarContrato(tx, this.bitacora, solicitud.contratoId, [EstadoContrato.PLANIFICADO],
        EstadoContrato.EN_COMPRA, autorId, `Compra registrada (${solicitud.folio})`);
      await this.bitacora.registrar({
        entidad: 'Compra', entidadId: compra.id, accion: 'CREAR', usuarioId: autorId,
        detalle: { solicitud: solicitud.folio, proveedor: proveedor.razonSocial, total, items: filas.length },
      }, tx);
      return compra;
    }).catch((e: unknown) => {
      if (e instanceof Error && e.message.startsWith('Stock insuficiente')) throw new BadRequestException(e.message);
      throw e;
    });
  }
}
