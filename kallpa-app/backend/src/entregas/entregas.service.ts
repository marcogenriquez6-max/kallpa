import { BadRequestException, Injectable } from '@nestjs/common';
import { BitacoraService } from '../bitacora/bitacora.service';
import { aMil, avanzarContrato, moverStock } from '../common/flujo';
import { EstadoContrato, EstadoSolicitud } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CrearEntregaDto } from './entregas.dto';

const ENTREGABLE: EstadoSolicitud[] = [
  EstadoSolicitud.APROBADA, EstadoSolicitud.EN_COMPRA, EstadoSolicitud.ENTREGADA_PARCIAL,
];

@Injectable()
export class EntregasService {
  constructor(private readonly prisma: PrismaService, private readonly bitacora: BitacoraService) {}

  listar(solicitudId?: string) {
    return this.prisma.entregaInsumos.findMany({
      where: { solicitudId },
      orderBy: { fechaHora: 'desc' },
      take: 300,
      include: {
        entregadoPor: { select: { nombre: true } },
        recibidoPor: { select: { nombre: true } },
        solicitud: { select: { id: true, folio: true, contrato: { select: { id: true, codigo: true, tipoEvento: true } } } },
        items: { include: { solicitudItem: { include: { insumo: { select: { nombre: true } }, unidad: true } } } },
      },
    });
  }

  /** Usuarios activos que pueden firmar la recepción en cocina. */
  receptores() {
    return this.prisma.usuario.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, rol: true },
      orderBy: { nombre: 'asc' },
    });
  }

  /**
   * Acta de entrega en cocina: descuenta del almacén (kardex SALIDA/ENTREGA) lo
   * recibido y deja la solicitud ENTREGADA o ENTREGADA_PARCIAL.
   */
  async crear(dto: CrearEntregaDto, autorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const solicitud = await tx.solicitudInsumos.findUnique({
        where: { id: dto.solicitudId },
        include: {
          items: { include: { unidad: true, insumo: { include: { unidadBase: true } }, entregaItems: true } },
        },
      });
      if (!solicitud) throw new BadRequestException('La solicitud no existe');
      if (!ENTREGABLE.includes(solicitud.estado)) {
        throw new BadRequestException(`No se puede entregar una solicitud ${solicitud.estado}`);
      }
      const receptor = await tx.usuario.findUnique({ where: { id: dto.recibidoPorId } });
      if (!receptor) throw new BadRequestException('El usuario que recibe no existe');

      const mapa = new Map(solicitud.items.map((i) => [i.id, i]));
      for (const it of dto.items) {
        if (!mapa.has(it.solicitudItemId)) throw new BadRequestException('Un ítem no pertenece a la solicitud');
      }

      const entrega = await tx.entregaInsumos.create({
        data: {
          solicitudId: solicitud.id,
          entregadoPorId: autorId,
          recibidoPorId: receptor.id,
          lugar: dto.lugar.trim(),
          conformidad: dto.conformidad,
          observaciones: dto.observaciones?.trim() || null,
          items: {
            create: dto.items.map((it) => ({
              solicitudItemId: it.solicitudItemId,
              cantidadRecibida: it.cantidadRecibida,
              conformidad: it.conformidad,
              observacion: it.observacion?.trim() || null,
            })),
          },
        },
      });

      for (const it of dto.items) {
        if (it.cantidadRecibida <= 0 || it.conformidad === 'RECHAZADO') continue;
        const si = mapa.get(it.solicitudItemId)!;
        const factor = (Number(si.unidad.factorBase) || 1) / (Number(si.insumo.unidadBase.factorBase) || 1);
        await moverStock(tx, {
          insumoId: si.insumoId, cantidad: -aMil(it.cantidadRecibida * factor), tipo: 'SALIDA', motivo: 'ENTREGA',
          contratoId: solicitud.contratoId, referenciaTipo: 'ENTREGA', referenciaId: entrega.id, usuarioId: autorId,
          observacion: `Entrega en cocina (${solicitud.folio})`,
        });
      }

      // ¿Queda algo pendiente? Se compara lo pedido con todo lo recibido (sin rechazos).
      const recibido = new Map<string, number>();
      for (const si of solicitud.items) {
        recibido.set(si.id, si.entregaItems.filter((e) => e.conformidad !== 'RECHAZADO')
          .reduce((s, e) => s + Number(e.cantidadRecibida), 0));
      }
      for (const it of dto.items) {
        if (it.conformidad !== 'RECHAZADO') {
          recibido.set(it.solicitudItemId, (recibido.get(it.solicitudItemId) ?? 0) + it.cantidadRecibida);
        }
      }
      const completo = solicitud.items.every(
        (si) => si.cantidad == null || (recibido.get(si.id) ?? 0) + 1e-9 >= Number(si.cantidad),
      );
      const nuevo = completo ? EstadoSolicitud.ENTREGADA : EstadoSolicitud.ENTREGADA_PARCIAL;
      await tx.solicitudInsumos.update({ where: { id: solicitud.id }, data: { estado: nuevo } });

      if (completo) {
        await avanzarContrato(tx, this.bitacora, solicitud.contratoId,
          [EstadoContrato.PLANIFICADO, EstadoContrato.EN_COMPRA], EstadoContrato.INSUMOS_ENTREGADOS,
          autorId, `Insumos entregados en cocina (${solicitud.folio})`);
      }
      await this.bitacora.registrar({
        entidad: 'EntregaInsumos', entidadId: entrega.id, accion: 'CREAR', usuarioId: autorId,
        estadoAnterior: solicitud.estado, estadoNuevo: nuevo,
        detalle: { solicitud: solicitud.folio, recibidoPor: receptor.nombre, conformidad: dto.conformidad },
      }, tx);
      return entrega;
    }).catch((e: unknown) => {
      if (e instanceof Error && e.message.startsWith('Stock insuficiente')) throw new BadRequestException(e.message);
      throw e;
    });
  }
}
