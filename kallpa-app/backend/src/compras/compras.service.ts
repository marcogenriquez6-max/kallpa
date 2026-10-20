import { Injectable, NotFoundException } from '@nestjs/common';
import { BitacoraService } from '../bitacora/bitacora.service';
import { PrismaService } from '../prisma/prisma.service';
import { CrearCompraDto } from './compras.dto';

@Injectable()
export class ComprasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  listar(filtro?: { proveedorId?: string }) {
    const where: any = {};
    if (filtro?.proveedorId) where.proveedorId = filtro.proveedorId;
    return this.prisma.compra.findMany({
      where,
      orderBy: { fechaEmision: 'desc' },
      include: { proveedor: true, solicitud: true, items: { include: { insumo: true } } },
    });
  }

  async obtener(id: string) {
    const compra = await this.prisma.compra.findUnique({
      where: { id },
      include: { proveedor: true, solicitud: true, items: { include: { insumo: true } } },
    });
    if (!compra) throw new NotFoundException('Compra no encontrada');
    return compra;
  }

  async crear(dto: CrearCompraDto, autorId: string) {
    return this.prisma.$transaction(async (tx) => {
      let total = 0;
      for (const item of dto.items) {
        total += item.cantidad * item.precioUnitario;
      }
      const compra = await tx.compra.create({
        data: {
          proveedorId: dto.proveedorId,
          solicitudId: dto.solicitudId,
          tipoComprobante: dto.tipoComprobante,
          nroComprobante: dto.nroComprobante,
          fechaEmision: dto.fechaEmision ? new Date(dto.fechaEmision) : new Date(),
          descuento: dto.descuento ?? 0,
          otrosCargos: dto.otrosCargos ?? 0,
          total,
          moneda: dto.moneda ?? 'BOB',
          observaciones: dto.observaciones,
          items: {
            create: dto.items.map((item) => ({
              insumoId: item.insumoId,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              subtotal: item.cantidad * item.precioUnitario,
              lote: item.lote,
              fechaVencimiento: item.fechaVencimiento ? new Date(item.fechaVencimiento) : null,
            })),
          },
        },
      });
      await this.bitacora.registrar(
        { entidad: 'Compra', entidadId: compra.id, accion: 'CREAR', usuarioId: autorId, detalle: { total: compra.total } },
        tx,
      );
      return this.obtener(compra.id);
    });
  }
}
