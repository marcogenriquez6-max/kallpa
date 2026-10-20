import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventarioService {
  constructor(private readonly prisma: PrismaService) {}

  async resumen() {
    const [insumos, lotes, movimientos] = await Promise.all([
      this.prisma.insumo.count({ where: { activo: true } }),
      this.prisma.movimientoInventario.count(),
      this.prisma.movimientoInventario.findMany({ orderBy: { fecha: 'desc' }, take: 10, include: { insumo: true } }),
    ]);
    return { insumosActivos: insumos, movimientosTotales: lotes, movimientosRecientes: movimientos };
  }

  existencias() {
    return this.prisma.insumo.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      include: { categoria: true, unidadConsumoRef: true },
    });
  }

  movimientos(filtro?: { insumoId?: string }) {
    const where: any = {};
    if (filtro?.insumoId) where.insumoId = filtro.insumoId;
    return this.prisma.movimientoInventario.findMany({
      where,
      orderBy: { fecha: 'desc' },
      include: { insumo: true },
    });
  }
}
