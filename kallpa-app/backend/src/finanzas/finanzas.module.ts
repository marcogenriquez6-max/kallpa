import {
  BadRequestException, Body, Controller, Get, Injectable, Module, Param, ParseUUIDPipe, Post, Query,
} from '@nestjs/common';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { BitacoraService } from '../bitacora/bitacora.service';
import { redondear } from '../common/flujo';
import { UsuarioSesion } from '../common/usuario-sesion';
import { EstadoContrato, Rol, TipoGasto, TipoPago } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

export class GastoDto {
  @IsEnum(TipoGasto) tipo: TipoGasto;
  @IsString() @MinLength(2) @MaxLength(80) categoria: string;
  @IsOptional() @IsString() @MaxLength(300) descripcion?: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) monto: number;
  @IsOptional() @IsDateString() fecha?: string;
  @IsOptional() @IsUUID() contratoId?: string;
}

const firmar = (p: { tipo: TipoPago; monto: unknown }) =>
  p.tipo === TipoPago.DEVOLUCION ? -Number(p.monto) : Number(p.monto);

@Injectable()
export class FinanzasService {
  constructor(private readonly prisma: PrismaService, private readonly bitacora: BitacoraService) {}

  gastos(filtro: { tipo?: TipoGasto; contratoId?: string; desde?: string; hasta?: string }) {
    return this.prisma.gasto.findMany({
      where: {
        tipo: filtro.tipo,
        contratoId: filtro.contratoId,
        fecha: { gte: filtro.desde ? new Date(filtro.desde) : undefined, lte: filtro.hasta ? fin(filtro.hasta) : undefined },
      },
      orderBy: { fecha: 'desc' },
      take: 500,
      include: { contrato: { select: { codigo: true } }, registradoPor: { select: { nombre: true } } },
    });
  }

  async crearGasto(dto: GastoDto, autorId: string) {
    if (dto.tipo === TipoGasto.EVENTO && !dto.contratoId) {
      throw new BadRequestException('Un gasto de evento debe indicar el contrato');
    }
    const g = await this.prisma.gasto.create({
      data: {
        tipo: dto.tipo, categoria: dto.categoria.trim(), descripcion: dto.descripcion?.trim() || null,
        monto: dto.monto, fecha: dto.fecha ? new Date(dto.fecha) : undefined,
        contratoId: dto.tipo === TipoGasto.EVENTO ? dto.contratoId : null, registradoPorId: autorId,
      },
    });
    await this.bitacora.registrar({
      entidad: 'Gasto', entidadId: g.id, accion: 'CREAR', usuarioId: autorId,
      detalle: { tipo: g.tipo, categoria: g.categoria, monto: dto.monto },
    });
    return g;
  }

  /** Ingresos, costos reales y utilidad de un contrato. */
  async liquidacion(id: string) {
    const c = await this.prisma.contrato.findUniqueOrThrow({
      where: { id },
      include: {
        cliente: { select: { nombre: true, telefono: true } },
        items: { include: { item: { select: { codigo: true, nombre: true } } } },
        pagos: { orderBy: { fecha: 'asc' } },
        gastos: { orderBy: { fecha: 'asc' } },
        remuneraciones: { include: { persona: { select: { nombre: true } } } },
        solicitudes: {
          include: { compras: { include: { proveedor: { select: { razonSocial: true } } } } },
        },
      },
    });
    const compras = c.solicitudes.flatMap((s) =>
      s.compras.map((k) => ({ id: k.id, folio: s.folio, proveedor: k.proveedor.razonSocial, fecha: k.fechaHora, total: Number(k.total) })),
    );
    const ingresos = redondear(c.pagos.reduce((s, p) => s + firmar(p), 0));
    const costoInsumos = redondear(compras.reduce((s, k) => s + k.total, 0));
    const costoGastos = redondear(c.gastos.reduce((s, g) => s + Number(g.monto), 0));
    const costoPersonal = redondear(c.remuneraciones.reduce((s, r) => s + Number(r.monto), 0));
    const costos = redondear(costoInsumos + costoGastos + costoPersonal);
    const precioTotal = Number(c.precioTotal);
    const platos = c.numeroPlatosFinal ?? c.numeroPlatos;
    return {
      contrato: c,
      compras,
      resumen: {
        precioTotal, ingresos, saldo: redondear(precioTotal - ingresos),
        costoInsumos, costoGastos, costoPersonal, costos,
        utilidad: redondear(precioTotal - costos),
        margen: precioTotal > 0 ? redondear(((precioTotal - costos) / precioTotal) * 100) : null,
        costoPorPlato: platos > 0 ? redondear(costos / platos) : null,
        remuneracionesPendientes: c.remuneraciones.filter((r) => !r.pagado).length,
      },
    };
  }

  /** Cierra el contrato: debe estar SERVIDO y con el saldo cobrado. */
  async liquidar(id: string, autorId: string) {
    const { contrato, resumen } = await this.liquidacion(id);
    if (contrato.estado !== EstadoContrato.SERVIDO) {
      throw new BadRequestException(`Solo se liquida un contrato SERVIDO (estado actual: ${contrato.estado})`);
    }
    if (resumen.saldo > 0.009) {
      throw new BadRequestException(`Falta cobrar el saldo de Bs ${resumen.saldo.toFixed(2)}`);
    }
    return this.prisma.$transaction(async (tx) => {
      const r = await tx.contrato.update({ where: { id }, data: { estado: EstadoContrato.LIQUIDADO } });
      await this.bitacora.registrar({
        entidad: 'Contrato', entidadId: id, accion: 'CAMBIAR_ESTADO', usuarioId: autorId,
        estadoAnterior: EstadoContrato.SERVIDO, estadoNuevo: EstadoContrato.LIQUIDADO,
        detalle: { utilidad: resumen.utilidad, costos: resumen.costos },
      }, tx);
      return r;
    });
  }

  /** Indicadores de un periodo (por fecha de evento, de pago y de gasto). */
  async resumenPeriodo(desde: string, hasta: string) {
    const d = new Date(desde);
    const h = fin(hasta);
    const [contratos, pagos, gastos, compras, remuneraciones, items] = await Promise.all([
      this.prisma.contrato.findMany({
        where: { fechaEvento: { gte: d, lte: h } },
        orderBy: { fechaEvento: 'asc' },
        include: { cliente: { select: { nombre: true, tipo: true } } },
      }),
      this.prisma.pago.findMany({ where: { fecha: { gte: d, lte: h } } }),
      this.prisma.gasto.findMany({ where: { fecha: { gte: d, lte: h } } }),
      this.prisma.compra.findMany({ where: { fechaHora: { gte: d, lte: h } }, include: { proveedor: { select: { razonSocial: true } } } }),
      this.prisma.remuneracionEvento.findMany({ where: { contrato: { fechaEvento: { gte: d, lte: h } } } }),
      this.prisma.contratoItem.groupBy({
        by: ['itemId'],
        where: { contrato: { fechaEvento: { gte: d, lte: h }, estado: { not: EstadoContrato.CANCELADO } } },
        _sum: { cantidad: true, subtotal: true },
      }),
    ]);
    const catalogo = await this.prisma.itemCatalogo.findMany({
      where: { id: { in: items.map((i) => i.itemId) } }, select: { id: true, codigo: true, nombre: true },
    });
    const nombre = new Map(catalogo.map((i) => [i.id, `${i.codigo} · ${i.nombre}`]));
    const porEstado: Record<string, number> = {};
    for (const c of contratos) porEstado[c.estado] = (porEstado[c.estado] ?? 0) + 1;
    const porProveedor = new Map<string, number>();
    for (const k of compras) porProveedor.set(k.proveedor.razonSocial, (porProveedor.get(k.proveedor.razonSocial) ?? 0) + Number(k.total));
    const validos = contratos.filter((c) => c.estado !== EstadoContrato.CANCELADO);

    const vendido = redondear(validos.reduce((s, c) => s + Number(c.precioTotal), 0));
    const cobrado = redondear(pagos.reduce((s, p) => s + firmar(p), 0));
    const costoCompras = redondear(compras.reduce((s, k) => s + Number(k.total), 0));
    const gastosEvento = redondear(gastos.filter((g) => g.tipo === 'EVENTO').reduce((s, g) => s + Number(g.monto), 0));
    const gastosFijos = redondear(gastos.filter((g) => g.tipo === 'FIJO').reduce((s, g) => s + Number(g.monto), 0));
    const costoPersonal = redondear(remuneraciones.reduce((s, r) => s + Number(r.monto), 0));
    const egresos = redondear(costoCompras + gastosEvento + gastosFijos + costoPersonal);
    return {
      periodo: { desde, hasta },
      indicadores: {
        contratos: contratos.length,
        cancelados: contratos.length - validos.length,
        platos: validos.reduce((s, c) => s + (c.numeroPlatosFinal ?? c.numeroPlatos), 0),
        vendido, cobrado, porCobrar: redondear(vendido - cobrado),
        costoCompras, gastosEvento, gastosFijos, costoPersonal, egresos,
        resultado: redondear(cobrado - egresos),
      },
      porEstado,
      contratos: contratos.map((c) => ({
        id: c.id, codigo: c.codigo, cliente: c.cliente.nombre, tipoEvento: c.tipoEvento,
        fechaEvento: c.fechaEvento, platos: c.numeroPlatosFinal ?? c.numeroPlatos,
        precioTotal: Number(c.precioTotal), estado: c.estado,
      })),
      topItems: items
        .map((i) => ({ item: nombre.get(i.itemId) ?? i.itemId, cantidad: i._sum.cantidad ?? 0, monto: Number(i._sum.subtotal ?? 0) }))
        .sort((a, b) => b.monto - a.monto)
        .slice(0, 10),
      comprasPorProveedor: [...porProveedor.entries()]
        .map(([proveedor, total]) => ({ proveedor, total: redondear(total) }))
        .sort((a, b) => b.total - a.total),
    };
  }
}

function fin(fecha: string): Date {
  const f = new Date(fecha);
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) f.setUTCHours(23, 59, 59, 999);
  return f;
}

@Controller('finanzas')
@Roles(Rol.GERENTE, Rol.CONSULTA)
export class FinanzasController {
  constructor(private readonly finanzas: FinanzasService) {}

  @Get('gastos')
  gastos(@Query('tipo') tipo?: TipoGasto, @Query('contratoId') contratoId?: string, @Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.finanzas.gastos({ tipo: tipo || undefined, contratoId: contratoId || undefined, desde: desde || undefined, hasta: hasta || undefined });
  }

  @Post('gastos') @Roles(Rol.GERENTE, Rol.LOGISTICA)
  crearGasto(@Body() dto: GastoDto, @UsuarioActual() u: UsuarioSesion) { return this.finanzas.crearGasto(dto, u.id); }

  @Get('contratos/:id/liquidacion')
  liquidacion(@Param('id', ParseUUIDPipe) id: string) { return this.finanzas.liquidacion(id); }

  @Post('contratos/:id/liquidar') @Roles(Rol.GERENTE)
  liquidar(@Param('id', ParseUUIDPipe) id: string, @UsuarioActual() u: UsuarioSesion) { return this.finanzas.liquidar(id, u.id); }
}

@Controller('reportes')
@Roles(Rol.GERENTE, Rol.CONSULTA)
export class ReportesController {
  constructor(private readonly finanzas: FinanzasService) {}

  @Get('resumen')
  resumen(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    const hoy = new Date();
    const d = desde || new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
    const h = hasta || hoy.toISOString().slice(0, 10);
    if (Number.isNaN(Date.parse(d)) || Number.isNaN(Date.parse(h))) throw new BadRequestException('Fechas inválidas');
    return this.finanzas.resumenPeriodo(d, h);
  }
}

@Module({ controllers: [FinanzasController, ReportesController], providers: [FinanzasService] })
export class FinanzasModule {}
