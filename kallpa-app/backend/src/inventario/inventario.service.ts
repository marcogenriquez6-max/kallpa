import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BitacoraService } from '../bitacora/bitacora.service';
import { MotivoMovimiento, TipoMovimiento } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CrearMovimientoDto } from './dto/movimiento.dto';

export interface FiltroExistencia {
  categoriaId?: number;
  q?: string;
  bajoMinimo?: boolean;
}

export interface FiltroMovimiento {
  insumoId?: string;
  tipo?: TipoMovimiento;
  motivo?: MotivoMovimiento;
  contratoId?: string;
  limite?: number;
}

/** Redondeo a tres decimales (precisión de la unidad base). */
function aMil(n: number): number {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

/**
 * Inventario: existencias por insumo (con alerta de stock mínimo) y kardex de
 * movimientos de almacén. El `stockActual` del insumo es una caché del último
 * saldo; el kardex es la fuente de verdad de todo ingreso o egreso.
 */
@Injectable()
export class InventarioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  // ------------------------------------------------------------------
  // Existencias
  // ------------------------------------------------------------------

  async listarExistencias(filtro: FiltroExistencia) {
    const insumos = await this.prisma.insumo.findMany({
      where: {
        activo: true,
        categoriaId: filtro.categoriaId,
        ...(filtro.q ? { nombre: { contains: filtro.q, mode: 'insensitive' as const } } : {}),
      },
      orderBy: [{ categoria: { orden: 'asc' } }, { nombre: 'asc' }],
      include: {
        categoria: { select: { id: true, nombre: true } },
        unidadBase: { select: { codigo: true, nombre: true } },
      },
    });

    const filas = insumos.map((i) => {
      const stockActual = Number(i.stockActual);
      const stockMinimo = Number(i.stockMinimo);
      return {
        id: i.id,
        nombre: i.nombre,
        categoria: i.categoria,
        unidadBaseCodigo: i.unidadBaseCodigo,
        unidadBase: i.unidadBase,
        stockActual,
        stockMinimo,
        bajoMinimo: stockMinimo > 0 && stockActual <= stockMinimo,
        perecible: i.perecible,
        requiereFrio: i.requiereFrio,
      };
    });

    return filtro.bajoMinimo ? filas.filter((f) => f.bajoMinimo) : filas;
  }

  /** Indicadores para el encabezado del módulo. */
  async resumen() {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const [existencias, movimientosMes] = await Promise.all([
      this.listarExistencias({}),
      this.prisma.movimientoInventario.count({ where: { fechaHora: { gte: inicioMes } } }),
    ]);

    return {
      insumosActivos: existencias.length,
      bajoMinimo: existencias.filter((f) => f.bajoMinimo).length,
      movimientosMes,
    };
  }

  // ------------------------------------------------------------------
  // Kardex
  // ------------------------------------------------------------------

  listarMovimientos(filtro: FiltroMovimiento) {
    return this.prisma.movimientoInventario.findMany({
      where: {
        insumoId: filtro.insumoId,
        tipo: filtro.tipo,
        motivo: filtro.motivo,
        contratoId: filtro.contratoId,
      },
      orderBy: { fechaHora: 'desc' },
      take: Math.min(filtro.limite ?? 100, 500),
      include: {
        insumo: {
          select: {
            id: true,
            nombre: true,
            unidadBaseCodigo: true,
            categoria: { select: { nombre: true } },
          },
        },
        contrato: { select: { codigo: true } },
        registradoPor: { select: { nombre: true } },
      },
    });
  }

  async movimientosDeInsumo(insumoId: string, limite?: number) {
    const insumo = await this.prisma.insumo.findUnique({ where: { id: insumoId } });
    if (!insumo) throw new NotFoundException(`No existe el insumo ${insumoId}`);
    return this.listarMovimientos({ insumoId, limite });
  }

  async registrar(dto: CrearMovimientoDto, autorId: string) {
    const cantidad = aMil(dto.cantidad);
    if (cantidad === 0) {
      throw new BadRequestException('La cantidad no puede ser cero');
    }
    if (dto.tipo === TipoMovimiento.ENTRADA && cantidad < 0) {
      throw new BadRequestException('Una entrada debe tener cantidad positiva');
    }
    if (dto.tipo === TipoMovimiento.SALIDA && cantidad > 0) {
      throw new BadRequestException('Una salida debe tener cantidad negativa');
    }

    return this.prisma.$transaction(async (tx) => {
      const insumo = await tx.insumo.findUnique({ where: { id: dto.insumoId } });
      if (!insumo) throw new NotFoundException(`No existe el insumo ${dto.insumoId}`);
      if (!insumo.activo) throw new BadRequestException('El insumo está inactivo');

      if (dto.contratoId) {
        const contrato = await tx.contrato.findUnique({ where: { id: dto.contratoId } });
        if (!contrato) throw new BadRequestException('El contrato indicado no existe');
      }

      const saldo = aMil(Number(insumo.stockActual) + cantidad);
      if (saldo < 0) {
        throw new BadRequestException(
          `El movimiento dejaría el stock en ${saldo} ${insumo.unidadBaseCodigo} (no puede ser negativo)`,
        );
      }

      const movimiento = await tx.movimientoInventario.create({
        data: {
          insumoId: insumo.id,
          tipo: dto.tipo,
          motivo: dto.motivo,
          cantidad,
          saldo,
          costoUnitario: dto.costoUnitario ?? null,
          contratoId: dto.contratoId ?? null,
          referenciaTipo: dto.referenciaTipo?.trim() || null,
          referenciaId: dto.referenciaId?.trim() || null,
          observacion: dto.observacion?.trim() || null,
          registradoPorId: autorId,
        },
        include: {
          insumo: { select: { id: true, nombre: true, unidadBaseCodigo: true } },
          registradoPor: { select: { nombre: true } },
        },
      });

      await tx.insumo.update({ where: { id: insumo.id }, data: { stockActual: saldo } });

      await this.bitacora.registrar(
        {
          entidad: 'MovimientoInventario',
          entidadId: movimiento.id,
          accion: 'CREAR',
          usuarioId: autorId,
          detalle: {
            insumo: insumo.nombre,
            tipo: dto.tipo,
            motivo: dto.motivo,
            cantidad,
            saldo,
          },
        },
        tx,
      );

      return movimiento;
    });
  }
}
