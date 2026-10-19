import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BitacoraService } from '../bitacora/bitacora.service';
import { Prisma } from '../generated/prisma/client';
import { EstadoContrato, TipoPago } from '../generated/prisma/enums';
import { ParametrosService } from '../parametros/parametros.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ActualizarContratoDto,
  ContratoItemDto,
  CrearContratoDto,
  ReemplazarItemsDto,
} from './dto/contrato.dto';
import { CambiarEstadoDto, ConfirmarPlatosDto } from './dto/estado.dto';
import { CrearPagoDto } from './dto/pago.dto';

export interface FiltroContrato {
  estado?: EstadoContrato;
  clienteId?: string;
  desde?: string;
  hasta?: string;
  q?: string;
}

/**
 * Transiciones válidas del contrato. Las etapas que dependen de otros módulos
 * (planificación, compras, producción) también se pueden fijar aquí mientras
 * esos módulos no existan; luego cada uno moverá el estado automáticamente.
 */
const TRANSICIONES: Record<EstadoContrato, EstadoContrato[]> = {
  COTIZACION: ['CONFIRMADO', 'CANCELADO'],
  CONFIRMADO: ['PLANIFICADO', 'CANCELADO'],
  PLANIFICADO: ['EN_COMPRA', 'CANCELADO'],
  EN_COMPRA: ['INSUMOS_ENTREGADOS', 'CANCELADO'],
  INSUMOS_ENTREGADOS: ['EN_PRODUCCION', 'CANCELADO'],
  EN_PRODUCCION: ['SERVIDO', 'CANCELADO'],
  SERVIDO: ['LIQUIDADO'],
  LIQUIDADO: [],
  CANCELADO: [],
};

function redondear(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Contratos de eventos: cliente, menú, pagos y ciclo de vida. */
@Injectable()
export class ContratosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
    private readonly parametros: ParametrosService,
  ) {}

  // ------------------------------------------------------------------
  // Consultas
  // ------------------------------------------------------------------

  async listar(filtro: FiltroContrato) {
    const contratos = await this.prisma.contrato.findMany({
      where: {
        estado: filtro.estado,
        clienteId: filtro.clienteId,
        fechaEvento: {
          gte: filtro.desde ? new Date(filtro.desde) : undefined,
          lte: filtro.hasta ? new Date(filtro.hasta) : undefined,
        },
        ...(filtro.q
          ? {
              OR: [
                { codigo: { contains: filtro.q, mode: 'insensitive' as const } },
                { lugar: { contains: filtro.q, mode: 'insensitive' as const } },
                { cliente: { nombre: { contains: filtro.q, mode: 'insensitive' as const } } },
              ],
            }
          : {}),
      },
      orderBy: [{ fechaEvento: 'desc' }, { codigo: 'desc' }],
      include: {
        cliente: { select: { nombre: true, telefono: true, tipo: true } },
        pagos: { select: { tipo: true, monto: true } },
        _count: { select: { items: true } },
      },
    });

    return contratos.map(({ pagos, ...c }) => {
      const precioTotal = Number(c.precioTotal);
      const abonado = this.sumarPagos(pagos);
      return { ...c, abonado, saldo: redondear(precioTotal - abonado) };
    });
  }

  async obtener(id: string) {
    const contrato = await this.prisma.contrato.findUnique({
      where: { id },
      include: {
        cliente: true,
        registradoPor: { select: { nombre: true } },
        items: { include: { item: true } },
        pagos: { orderBy: { fecha: 'asc' } },
      },
    });
    if (!contrato) throw new NotFoundException(`No existe el contrato ${id}`);

    const [anticipoPorcentaje, invitadosPorGarzon] = await Promise.all([
      this.parametros.numero('ANTICIPO_PORCENTAJE'),
      this.parametros.numero('INVITADOS_POR_GARZON'),
    ]);
    const precioTotal = Number(contrato.precioTotal);
    const abonado = this.sumarPagos(contrato.pagos);
    const platos = contrato.numeroPlatosFinal ?? contrato.numeroPlatos;

    return {
      ...contrato,
      resumen: {
        anticipoPorcentaje,
        anticipoEsperado: redondear((precioTotal * anticipoPorcentaje) / 100),
        abonado,
        saldo: redondear(precioTotal - abonado),
        garzonesSugeridos: Math.max(1, Math.ceil(platos / invitadosPorGarzon)),
      },
    };
  }

  // ------------------------------------------------------------------
  // Alta y edición
  // ------------------------------------------------------------------

  async crear(dto: CrearContratoDto, autorId: string) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id: dto.clienteId } });
    if (!cliente) throw new BadRequestException('El cliente indicado no existe');

    const [min, max, invitadosPorGarzon] = await Promise.all([
      this.parametros.numero('PLATOS_MIN'),
      this.parametros.numero('PLATOS_MAX'),
      this.parametros.numero('INVITADOS_POR_GARZON'),
    ]);
    if (dto.numeroPlatos < min || dto.numeroPlatos > max) {
      throw new BadRequestException(
        `El número de platos debe estar entre ${min} y ${max} (parámetros PLATOS_MIN / PLATOS_MAX)`,
      );
    }

    const filas = await this.prepararItems(dto.items);
    const precioTotal = redondear(filas.reduce((s, f) => s + f.subtotal, 0));
    const garzones = Math.max(1, Math.ceil(dto.numeroPlatos / invitadosPorGarzon));
    const fechaEvento = new Date(dto.fechaEvento);

    return this.prisma.$transaction(async (tx) => {
      const codigo = await this.generarCodigo(tx, fechaEvento.getFullYear());
      const contrato = await tx.contrato.create({
        data: {
          codigo,
          clienteId: dto.clienteId,
          registradoPorId: autorId,
          tipoEvento: dto.tipoEvento.trim(),
          fechaEvento,
          horaServicio: dto.horaServicio,
          lugar: dto.lugar.trim(),
          direccion: dto.direccion?.trim() || null,
          numeroPlatos: dto.numeroPlatos,
          garzonesIncluidos: garzones,
          precioTotal,
          requisitosEspeciales: dto.requisitosEspeciales?.trim() || null,
          observaciones: dto.observaciones?.trim() || null,
          items: {
            create: filas.map((f) => ({
              itemId: f.itemId,
              cantidad: f.cantidad,
              precioUnitario: f.precioUnitario,
              subtotal: f.subtotal,
            })),
          },
        },
      });
      await this.bitacora.registrar(
        {
          entidad: 'Contrato',
          entidadId: contrato.id,
          accion: 'CREAR',
          usuarioId: autorId,
          estadoNuevo: contrato.estado,
          detalle: {
            codigo: contrato.codigo,
            cliente: cliente.nombre,
            fechaEvento: dto.fechaEvento,
            numeroPlatos: dto.numeroPlatos,
            precioTotal,
          },
        },
        tx,
      );
      return contrato;
    });
  }

  async actualizar(id: string, dto: ActualizarContratoDto, autorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const anterior = await tx.contrato.findUniqueOrThrow({ where: { id } });
      this.exigirEstado(anterior.estado, [EstadoContrato.COTIZACION, EstadoContrato.CONFIRMADO], 'editar el contrato');

      if (dto.clienteId) {
        const cliente = await tx.cliente.findUnique({ where: { id: dto.clienteId } });
        if (!cliente) throw new BadRequestException('El cliente indicado no existe');
      }

      const invitadosPorGarzon = await this.parametros.numero('INVITADOS_POR_GARZON');
      const data: Prisma.ContratoUncheckedUpdateInput = {};
      if (dto.clienteId !== undefined) data.clienteId = dto.clienteId;
      if (dto.tipoEvento !== undefined) data.tipoEvento = dto.tipoEvento.trim();
      if (dto.fechaEvento !== undefined) data.fechaEvento = new Date(dto.fechaEvento);
      if (dto.horaServicio !== undefined) data.horaServicio = dto.horaServicio;
      if (dto.lugar !== undefined) data.lugar = dto.lugar.trim();
      if (dto.direccion !== undefined) data.direccion = dto.direccion.trim() || null;
      if (dto.requisitosEspeciales !== undefined) {
        data.requisitosEspeciales = dto.requisitosEspeciales.trim() || null;
      }
      if (dto.observaciones !== undefined) data.observaciones = dto.observaciones.trim() || null;
      if (dto.numeroPlatos !== undefined) {
        data.numeroPlatos = dto.numeroPlatos;
        const platosEfectivos = anterior.numeroPlatosFinal ?? dto.numeroPlatos;
        data.garzonesIncluidos = Math.max(1, Math.ceil(platosEfectivos / invitadosPorGarzon));
      }

      const contrato = await tx.contrato.update({ where: { id }, data });
      await this.bitacora.registrar(
        {
          entidad: 'Contrato',
          entidadId: id,
          accion: 'EDITAR',
          usuarioId: autorId,
          detalle: {
            antes: { lugar: anterior.lugar, numeroPlatos: anterior.numeroPlatos },
            despues: dto as unknown as Prisma.InputJsonValue,
          },
        },
        tx,
      );
      return contrato;
    });
  }

  async reemplazarItems(id: string, dto: ReemplazarItemsDto, autorId: string) {
    const filas = await this.prepararItems(dto.items);
    const precioTotal = redondear(filas.reduce((s, f) => s + f.subtotal, 0));

    return this.prisma.$transaction(async (tx) => {
      const anterior = await tx.contrato.findUniqueOrThrow({ where: { id } });
      this.exigirEstado(anterior.estado, [EstadoContrato.COTIZACION], 'cambiar el menú');

      await tx.contratoItem.deleteMany({ where: { contratoId: id } });
      await tx.contratoItem.createMany({
        data: filas.map((f) => ({ contratoId: id, ...f })),
      });
      const contrato = await tx.contrato.update({
        where: { id },
        data: { precioTotal },
        include: { items: true },
      });
      await this.bitacora.registrar(
        {
          entidad: 'Contrato',
          entidadId: id,
          accion: 'EDITAR',
          usuarioId: autorId,
          detalle: {
            antes: { precioTotal: anterior.precioTotal.toString() },
            despues: { precioTotal, items: filas.length },
          },
        },
        tx,
      );
      return contrato;
    });
  }

  // ------------------------------------------------------------------
  // Pagos y estados
  // ------------------------------------------------------------------

  async registrarPago(id: string, dto: CrearPagoDto, autorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const contrato = await tx.contrato.findUniqueOrThrow({ where: { id } });
      if (contrato.estado === EstadoContrato.CANCELADO && dto.tipo !== TipoPago.DEVOLUCION) {
        throw new BadRequestException(
          'Un contrato cancelado solo admite pagos de tipo devolución',
        );
      }
      if (contrato.estado === EstadoContrato.LIQUIDADO) {
        throw new BadRequestException('El contrato ya está liquidado');
      }

      const pago = await tx.pago.create({
        data: {
          contratoId: id,
          tipo: dto.tipo,
          monto: dto.monto,
          metodo: dto.metodo.trim(),
          comprobante: dto.comprobante?.trim() || null,
        },
      });

      // El primer anticipo confirma el evento automáticamente.
      if (dto.tipo === TipoPago.ANTICIPO && contrato.estado === EstadoContrato.COTIZACION) {
        await tx.contrato.update({
          where: { id },
          data: { estado: EstadoContrato.CONFIRMADO },
        });
        await this.bitacora.registrar(
          {
            entidad: 'Contrato',
            entidadId: id,
            accion: 'CAMBIAR_ESTADO',
            usuarioId: autorId,
            estadoAnterior: EstadoContrato.COTIZACION,
            estadoNuevo: EstadoContrato.CONFIRMADO,
            detalle: { motivo: 'Anticipo registrado' },
          },
          tx,
        );
      }

      await this.bitacora.registrar(
        {
          entidad: 'Pago',
          entidadId: contrato.id,
          accion: 'CREAR',
          usuarioId: autorId,
          detalle: { tipo: dto.tipo, monto: dto.monto, metodo: dto.metodo },
        },
        tx,
      );
      return pago;
    });
  }

  async confirmarPlatos(id: string, dto: ConfirmarPlatosDto, autorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const anterior = await tx.contrato.findUniqueOrThrow({ where: { id } });
      this.exigirEstado(
        anterior.estado,
        [EstadoContrato.CONFIRMADO, EstadoContrato.PLANIFICADO],
        'confirmar el número final de platos',
      );

      const invitadosPorGarzon = await this.parametros.numero('INVITADOS_POR_GARZON');
      const contrato = await tx.contrato.update({
        where: { id },
        data: {
          numeroPlatosFinal: dto.numeroPlatosFinal,
          fechaConfirmacion: new Date(),
          garzonesIncluidos: Math.max(1, Math.ceil(dto.numeroPlatosFinal / invitadosPorGarzon)),
        },
      });
      await this.bitacora.registrar(
        {
          entidad: 'Contrato',
          entidadId: id,
          accion: 'EDITAR',
          usuarioId: autorId,
          detalle: {
            antes: { numeroPlatosFinal: anterior.numeroPlatosFinal ?? null },
            despues: { numeroPlatosFinal: dto.numeroPlatosFinal },
          },
        },
        tx,
      );
      return contrato;
    });
  }

  async cambiarEstado(id: string, dto: CambiarEstadoDto, autorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const contrato = await tx.contrato.findUniqueOrThrow({ where: { id } });
      if (contrato.estado === dto.estado) {
        return contrato;
      }
      const permitidos = TRANSICIONES[contrato.estado];
      if (!permitidos.includes(dto.estado)) {
        throw new BadRequestException(
          `No se puede pasar de ${contrato.estado} a ${dto.estado}. Estados válidos: ${
            permitidos.join(', ') || 'ninguno'
          }`,
        );
      }
      if (dto.estado === EstadoContrato.CONFIRMADO) {
        const anticipo = await tx.pago.findFirst({
          where: { contratoId: id, tipo: TipoPago.ANTICIPO },
        });
        if (!anticipo) {
          throw new BadRequestException(
            'Para confirmar el contrato primero debe registrar el anticipo',
          );
        }
      }

      const actualizado = await tx.contrato.update({ where: { id }, data: { estado: dto.estado } });
      await this.bitacora.registrar(
        {
          entidad: 'Contrato',
          entidadId: id,
          accion: 'CAMBIAR_ESTADO',
          usuarioId: autorId,
          estadoAnterior: contrato.estado,
          estadoNuevo: dto.estado,
          detalle: dto.motivo ? { motivo: dto.motivo } : undefined,
        },
        tx,
      );
      return actualizado;
    });
  }

  // ------------------------------------------------------------------
  // Apoyo
  // ------------------------------------------------------------------

  private async prepararItems(items: ContratoItemDto[]) {
    const ids = [...new Set(items.map((i) => i.itemId))];
    const catalogo = await this.prisma.itemCatalogo.findMany({ where: { id: { in: ids } } });
    const mapa = new Map(catalogo.map((i) => [i.id, i]));
    const faltantes = ids.filter((id) => !mapa.has(id));
    if (faltantes.length) {
      throw new BadRequestException('Alguno de los ítems del menú no existe en el catálogo');
    }
    return items.map((i) => {
      const item = mapa.get(i.itemId)!;
      const precioUnitario = Number(item.precioVenta);
      return {
        itemId: i.itemId,
        cantidad: i.cantidad,
        precioUnitario,
        subtotal: redondear(precioUnitario * i.cantidad),
      };
    });
  }

  private async generarCodigo(tx: Prisma.TransactionClient, anio: number): Promise<string> {
    const prefijo = `KAL-CT-${anio}-`;
    const ultimo = await tx.contrato.findFirst({
      where: { codigo: { startsWith: prefijo } },
      orderBy: { codigo: 'desc' },
      select: { codigo: true },
    });
    const siguiente = ultimo ? Number(ultimo.codigo.slice(prefijo.length)) + 1 : 1;
    return prefijo + String(siguiente).padStart(4, '0');
  }

  private sumarPagos(pagos: { tipo: TipoPago; monto: unknown }[]): number {
    const total = pagos.reduce(
      (s, p) => s + (p.tipo === TipoPago.DEVOLUCION ? -Number(p.monto) : Number(p.monto)),
      0,
    );
    return redondear(total);
  }

  private exigirEstado(actual: EstadoContrato, permitidos: EstadoContrato[], accion: string) {
    if (!permitidos.includes(actual)) {
      throw new BadRequestException(
        `No se puede ${accion} en estado ${actual}. Estados permitidos: ${permitidos.join(', ')}`,
      );
    }
  }
}
