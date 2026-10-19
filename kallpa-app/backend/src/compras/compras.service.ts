import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { BitacoraService } from '../bitacora/bitacora.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComprasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  async listar(activo?: boolean) {
    return this.prisma.compra.findMany({
      where: activo !== undefined ? { activo: activo } : {},
      orderBy: { fechaHora: 'desc' },
      include: {
        proveedor: { select: { razonSocial: true } },
      },
    });
  }

  async crear(dto: any, autorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const proveedor = await tx.proveedor.findUnique({
        where: { id: dto.proveedorId },
      });
      if (!proveedor) throw new BadRequestException('El proveedor no existe');

      const compra = await tx.compra.create({
        data: {
          proveedorId: dto.proveedorId,
          compradoPorId: autorId,
          fechaHora: new Date(),
        }),
      });
      // @ts-ignore
      await this.bitacora.registrar({
        entidad: 'Compra',
        entidadId: compra.id,
        accion: 'CREAR',
        usuarioId: autorId,
        detalle: { proveedor: proveedor.razonSocial },
      });
      return compra;
    });
  }

  async recepcionar(
    compraId: string,
    cantidad: number,
    proveedorInsumoId: string,
    observacion: string,
    autorId: string,
  ) {
    const compra = await this.prisma.compra.findUniqueOrThrow({ where: { id: compraId } });
    const insumo = await this.prisma.insumo.findUnique({ where: { id: proveedorInsumoId } });
    if (!insumo) throw new NotFoundException('El insumo no existe');

    return this.prisma.$transaction(async (tx) => {
      const saldoActual = Number(insumo.stockActual);
      const nuevoSaldo = saldoActual + cantidad;

      // @ts-ignore
      const nuevoMovimiento = await tx.movimientoInventario.create({
        data: {
          insumoId: insumo.id,
          tipo: 'ENTRADA',
          motivo: 'OTRO',
          cantidad: cantidad,
          saldo: nuevoSaldo,
          costoUnitario: null,
          contratoId: null,
          referenciaTipo: 'COMPRA',
          referenciaId: compra.id,
          observacion: observacion,
          registradoPorId: autorId,
        },
        include: {
          insumo: { select: { id: true, nombre: true, unidadBaseCodigo: true } },
          registradoPor: { select: { nombre: true } },
        },
      } as any);

      // @ts-ignore
      await tx.insumo.update({ where: { id: insumo.id }, data: { stockActual: nuevoSaldo } });

      return { mensaje: 'Recepción registrada', nuevoSaldo, movimiento: nuevoMovimiento };
    });
  }
}
