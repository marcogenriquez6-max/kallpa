import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BitacoraService } from '../bitacora/bitacora.service';
import { Prisma } from '../generated/prisma/client';
import { EstadoContrato, EstadoSolicitud, OrigenInsumo } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import {
  ActualizarItemSolicitudDto,
  AgregarItemSolicitudDto,
  AnularSolicitudDto,
  CrearSolicitudDto,
} from './dto/solicitud.dto';

export interface FiltroSolicitud {
  contratoId?: string;
  estado?: EstadoSolicitud;
}

/** Estados que admiten anulación (una solicitud ya entregada no se anula). */
const ANULABLES: EstadoSolicitud[] = [
  EstadoSolicitud.BORRADOR,
  EstadoSolicitud.APROBADA,
  EstadoSolicitud.EN_COMPRA,
  EstadoSolicitud.ENTREGADA_PARCIAL,
];

function aMil(n: number): number {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

/**
 * Solicitud de insumos (formulario F-001): parte de la explosión de insumos de
 * las fichas técnicas del menú contratado y la revisa el chef antes de aprobarla.
 * Al aprobarla, el contrato pasa a PLANIFICADO.
 */
@Injectable()
export class SolicitudesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  // ------------------------------------------------------------------
  // Consultas
  // ------------------------------------------------------------------

  listar(filtro: FiltroSolicitud) {
    return this.prisma.solicitudInsumos.findMany({
      where: { contratoId: filtro.contratoId, estado: filtro.estado },
      orderBy: { fechaHoraSolicitud: 'desc' },
      include: {
        contrato: {
          select: {
            codigo: true,
            tipoEvento: true,
            fechaEvento: true,
            numeroPlatos: true,
            numeroPlatosFinal: true,
            estado: true,
          },
        },
        creadaPor: { select: { nombre: true } },
        _count: { select: { items: true } },
      },
    });
  }

  async obtener(id: string) {
    const solicitud = await this.prisma.solicitudInsumos.findUnique({
      where: { id },
      include: {
        contrato: { include: { cliente: { select: { nombre: true } } } },
        creadaPor: { select: { nombre: true } },
        aprobadaPor: { select: { nombre: true } },
        items: {
          orderBy: { insumo: { nombre: 'asc' } },
          include: { insumo: { include: { categoria: true, unidadBase: true } }, unidad: true },
        },
      },
    });
    if (!solicitud) throw new NotFoundException(`No existe la solicitud ${id}`);
    return solicitud;
  }

  // ------------------------------------------------------------------
  // Generación por explosión de insumos
  // ------------------------------------------------------------------

  /**
   * Calcula los insumos a partir de las fichas técnicas vigentes del menú y las
   * cantidades contratadas. Cada generación crea una versión nueva; la anterior
   * queda como historial. Nace en estado BORRADOR para la revisión del chef.
   */
  async generar(dto: CrearSolicitudDto, autorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const contrato = await tx.contrato.findUnique({
        where: { id: dto.contratoId },
        include: {
          items: {
            include: {
              item: {
                include: {
                  fichas: {
                    where: { vigente: true },
                    include: {
                      lineas: {
                        include: {
                          insumo: { include: { unidadBase: true } },
                          unidad: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
      if (!contrato) throw new BadRequestException('El contrato indicado no existe');
      if (contrato.estado === EstadoContrato.CANCELADO || contrato.estado === EstadoContrato.LIQUIDADO) {
        throw new BadRequestException(`No se puede generar la solicitud de un contrato ${contrato.estado}`);
      }
      if (contrato.items.length === 0) {
        throw new BadRequestException('El contrato no tiene un menú contratado');
      }

      const platosBase = contrato.numeroPlatosFinal ?? contrato.numeroPlatos;
      const avisos: string[] = [];
      const calculados = new Map<
        string,
        { insumoId: string; unidadCodigo: string; cantidad: number; stockActual: number; especificacion?: string }
      >();
      const aCriterio = new Map<string, { insumoId: string; unidadCodigo: string; especificacion?: string }>();

      for (const contratoItem of contrato.items) {
        const ficha = contratoItem.item.fichas[0];
        if (!ficha) {
          avisos.push(`«${contratoItem.item.nombre}» no tiene ficha técnica vigente`);
          continue;
        }
        const platos = contratoItem.cantidad;

        for (const linea of ficha.lineas) {
          const insumo = linea.insumo;
          if (linea.aCriterio) {
            if (!aCriterio.has(insumo.id)) {
              aCriterio.set(insumo.id, {
                insumoId: insumo.id,
                unidadCodigo: insumo.unidadBaseCodigo,
                especificacion: linea.especificacion?.trim() || undefined,
              });
            }
            continue;
          }

          const factorLinea = Number(linea.unidad.factorBase) || 1;
          const factorBase = Number(insumo.unidadBase.factorBase) || 1;
          const factorMerma = 1 + Number(linea.porcentajeMerma) / 100;
          const cantidadEnBase =
            platos * Number(linea.cantidadPorPorcion) * (factorLinea / factorBase) * factorMerma;

          const previo = calculados.get(insumo.id);
          if (previo) {
            previo.cantidad += cantidadEnBase;
          } else {
            calculados.set(insumo.id, {
              insumoId: insumo.id,
              unidadCodigo: insumo.unidadBaseCodigo,
              cantidad: cantidadEnBase,
              stockActual: Number(insumo.stockActual),
              especificacion: linea.especificacion?.trim() || undefined,
            });
          }
        }
      }

      const filas: Prisma.SolicitudItemCreateManySolicitudInput[] = [];
      for (const c of calculados.values()) {
        const cantidad = aMil(c.cantidad);
        filas.push({
          insumoId: c.insumoId,
          cantidadCalculada: aMil(c.cantidad),
          cantidad,
          unidadCodigo: c.unidadCodigo,
          origen: c.stockActual >= cantidad ? OrigenInsumo.STOCK : OrigenInsumo.COMPRAR,
          especificacion: c.especificacion ?? null,
        });
      }
      for (const a of aCriterio.values()) {
        if (calculados.has(a.insumoId)) continue;
        filas.push({
          insumoId: a.insumoId,
          cantidadCalculada: null,
          cantidad: null,
          unidadCodigo: a.unidadCodigo,
          origen: OrigenInsumo.A_CRITERIO,
          especificacion: a.especificacion ?? null,
        });
      }

      const folio = await this.generarFolio(tx);
      const version = await this.siguienteVersion(tx, contrato.id);
      const fechaHoraRequerida = dto.fechaHoraRequerida
        ? new Date(dto.fechaHoraRequerida)
        : this.fechaRequeridaPorDefecto(contrato.fechaEvento, contrato.horaServicio);

      const solicitud = await tx.solicitudInsumos.create({
        data: {
          folio,
          contratoId: contrato.id,
          version,
          platosBase,
          creadaPorId: autorId,
          fechaHoraRequerida,
          observaciones: dto.observaciones?.trim() || null,
          items: { createMany: { data: filas } },
        },
        include: {
          items: {
            include: { insumo: { include: { categoria: true, unidadBase: true } }, unidad: true },
          },
        },
      });

      await this.bitacora.registrar(
        {
          entidad: 'SolicitudInsumos',
          entidadId: solicitud.id,
          accion: 'CREAR',
          usuarioId: autorId,
          estadoNuevo: solicitud.estado,
          detalle: {
            folio,
            contrato: contrato.codigo,
            version,
            platosBase,
            insumos: filas.length,
            avisos,
          },
        },
        tx,
      );

      return { ...solicitud, avisos };
    });
  }

  // ------------------------------------------------------------------
  // Revisión del chef
  // ------------------------------------------------------------------

  async agregarItem(id: string, dto: AgregarItemSolicitudDto, autorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const solicitud = await tx.solicitudInsumos.findUniqueOrThrow({ where: { id } });
      this.exigirBorrador(solicitud.estado, 'agregar insumos');
      const insumo = await tx.insumo.findUnique({ where: { id: dto.insumoId } });
      if (!insumo) throw new BadRequestException('El insumo indicado no existe');

      const item = await tx.solicitudItem.create({
        data: {
          solicitudId: id,
          insumoId: dto.insumoId,
          unidadCodigo: dto.unidadCodigo ?? insumo.unidadBaseCodigo,
          cantidad: dto.cantidad ?? null,
          cantidadCalculada: null,
          origen: dto.origen ?? OrigenInsumo.COMPRAR,
          especificacion: dto.especificacion?.trim() || null,
          marca: dto.marca?.trim() || null,
          marcaObligatoria: dto.marcaObligatoria ?? false,
          observacion: dto.observacion?.trim() || null,
        },
      });
      await this.bitacora.registrar(
        {
          entidad: 'SolicitudInsumos',
          entidadId: id,
          accion: 'EDITAR',
          usuarioId: autorId,
          detalle: { accion: 'AGREGAR_INSUMO', insumo: insumo.nombre },
        },
        tx,
      );
      return item;
    });
  }

  async actualizarItem(id: string, itemId: string, dto: ActualizarItemSolicitudDto, autorId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.exigirBorradorTx(tx, id, 'editar los insumos');
      const item = await tx.solicitudItem.findUnique({ where: { id: itemId } });
      if (!item || item.solicitudId !== id) {
        throw new NotFoundException(`No existe el insumo ${itemId} en la solicitud`);
      }

      const data: Prisma.SolicitudItemUncheckedUpdateInput = {};
      if (dto.cantidad !== undefined) data.cantidad = dto.cantidad;
      if (dto.origen !== undefined) {
        data.origen = dto.origen;
        if (dto.origen === OrigenInsumo.A_CRITERIO) data.cantidad = null;
      }
      if (dto.especificacion !== undefined) data.especificacion = dto.especificacion.trim() || null;
      if (dto.marca !== undefined) data.marca = dto.marca.trim() || null;
      if (dto.marcaObligatoria !== undefined) data.marcaObligatoria = dto.marcaObligatoria;
      if (dto.observacion !== undefined) data.observacion = dto.observacion.trim() || null;

      const actualizado = await tx.solicitudItem.update({ where: { id: itemId }, data });
      await this.bitacora.registrar(
        {
          entidad: 'SolicitudInsumos',
          entidadId: id,
          accion: 'EDITAR',
          usuarioId: autorId,
          detalle: { accion: 'EDITAR_INSUMO', insumoId: item.insumoId },
        },
        tx,
      );
      return actualizado;
    });
  }

  async eliminarItem(id: string, itemId: string, autorId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.exigirBorradorTx(tx, id, 'quitar insumos');
      const item = await tx.solicitudItem.findUnique({ where: { id: itemId } });
      if (!item || item.solicitudId !== id) {
        throw new NotFoundException(`No existe el insumo ${itemId} en la solicitud`);
      }
      await tx.solicitudItem.delete({ where: { id: itemId } });
      await this.bitacora.registrar(
        {
          entidad: 'SolicitudInsumos',
          entidadId: id,
          accion: 'EDITAR',
          usuarioId: autorId,
          detalle: { accion: 'QUITAR_INSUMO', insumoId: item.insumoId },
        },
        tx,
      );
      return { eliminado: true };
    });
  }

  // ------------------------------------------------------------------
  // Aprobación y anulación
  // ------------------------------------------------------------------

  /** El chef firma la solicitud: pasa a APROBADA y el contrato a PLANIFICADO. */
  async aprobar(id: string, autorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const solicitud = await tx.solicitudInsumos.findUniqueOrThrow({
        where: { id },
        include: { contrato: true, _count: { select: { items: true } } },
      });
      if (solicitud.estado !== EstadoSolicitud.BORRADOR) {
        throw new BadRequestException(`Solo se puede aprobar una solicitud en BORRADOR (estado actual: ${solicitud.estado})`);
      }
      if (solicitud._count.items === 0) {
        throw new BadRequestException('La solicitud no tiene insumos');
      }

      const actualizada = await tx.solicitudInsumos.update({
        where: { id },
        data: {
          estado: EstadoSolicitud.APROBADA,
          aprobadaPorId: autorId,
          fechaHoraAprobacion: new Date(),
        },
      });
      await this.bitacora.registrar(
        {
          entidad: 'SolicitudInsumos',
          entidadId: id,
          accion: 'CAMBIAR_ESTADO',
          usuarioId: autorId,
          estadoAnterior: EstadoSolicitud.BORRADOR,
          estadoNuevo: EstadoSolicitud.APROBADA,
          detalle: { folio: solicitud.folio, contrato: solicitud.contrato.codigo },
        },
        tx,
      );

      if (solicitud.contrato.estado === EstadoContrato.CONFIRMADO) {
        await tx.contrato.update({
          where: { id: solicitud.contratoId },
          data: { estado: EstadoContrato.PLANIFICADO },
        });
        await this.bitacora.registrar(
          {
            entidad: 'Contrato',
            entidadId: solicitud.contratoId,
            accion: 'CAMBIAR_ESTADO',
            usuarioId: autorId,
            estadoAnterior: EstadoContrato.CONFIRMADO,
            estadoNuevo: EstadoContrato.PLANIFICADO,
            detalle: { motivo: `Solicitud ${solicitud.folio} aprobada` },
          },
          tx,
        );
      }

      return actualizada;
    });
  }

  async anular(id: string, dto: AnularSolicitudDto, autorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const solicitud = await tx.solicitudInsumos.findUniqueOrThrow({ where: { id } });
      if (!ANULABLES.includes(solicitud.estado)) {
        throw new BadRequestException(`No se puede anular una solicitud ${solicitud.estado}`);
      }
      const actualizada = await tx.solicitudInsumos.update({
        where: { id },
        data: { estado: EstadoSolicitud.ANULADA, observaciones: dto.motivo?.trim() || solicitud.observaciones },
      });
      await this.bitacora.registrar(
        {
          entidad: 'SolicitudInsumos',
          entidadId: id,
          accion: 'ANULAR',
          usuarioId: autorId,
          estadoAnterior: solicitud.estado,
          estadoNuevo: EstadoSolicitud.ANULADA,
          detalle: dto.motivo ? { motivo: dto.motivo } : undefined,
        },
        tx,
      );
      return actualizada;
    });
  }

  // ------------------------------------------------------------------
  // Apoyo
  // ------------------------------------------------------------------

  private async exigirBorradorTx(tx: Prisma.TransactionClient, id: string, accion: string) {
    const solicitud = await tx.solicitudInsumos.findUniqueOrThrow({ where: { id } });
    this.exigirBorrador(solicitud.estado, accion);
  }

  private exigirBorrador(estado: EstadoSolicitud, accion: string) {
    if (estado !== EstadoSolicitud.BORRADOR) {
      throw new BadRequestException(
        `No se puede ${accion} fuera del estado BORRADOR (estado actual: ${estado})`,
      );
    }
  }

  private async generarFolio(tx: Prisma.TransactionClient): Promise<string> {
    const prefijo = `KAL-SI-${new Date().getFullYear()}-`;
    const ultimo = await tx.solicitudInsumos.findFirst({
      where: { folio: { startsWith: prefijo } },
      orderBy: { folio: 'desc' },
      select: { folio: true },
    });
    const siguiente = ultimo ? Number(ultimo.folio.slice(prefijo.length)) + 1 : 1;
    return prefijo + String(siguiente).padStart(4, '0');
  }

  private async siguienteVersion(tx: Prisma.TransactionClient, contratoId: string): Promise<number> {
    const ultima = await tx.solicitudInsumos.findFirst({
      where: { contratoId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    return (ultima?.version ?? 0) + 1;
  }

  private fechaRequeridaPorDefecto(fechaEvento: Date, horaServicio: string): Date {
    const fecha = new Date(fechaEvento);
    const [h, m] = horaServicio.split(':').map((n) => Number.parseInt(n, 10));
    if (Number.isFinite(h)) fecha.setHours(h, Number.isFinite(m) ? m : 0, 0, 0);
    return fecha;
  }
}
