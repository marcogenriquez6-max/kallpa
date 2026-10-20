import { Injectable, NotFoundException } from '@nestjs/common';
import { BitacoraService } from '../bitacora/bitacora.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarSolicitudDto, CrearSolicitudDto } from './solicitudes.dto';

@Injectable()
export class SolicitudesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  listar(filtro?: { estado?: string }) {
    const where: any = {};
    if (filtro?.estado) where.estado = filtro.estado;
    return this.prisma.solicitudInsumos.findMany({
      where,
      orderBy: { fechaSolicitud: 'desc' },
      include: { contrato: { include: { cliente: true } }, items: { include: { insumo: true } } },
    });
  }

  async obtener(id: string) {
    const solicitud = await this.prisma.solicitudInsumos.findUnique({
      where: { id },
      include: { contrato: { include: { cliente: true } }, items: { include: { insumo: true } } },
    });
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
    return solicitud;
  }

  async crear(dto: CrearSolicitudDto, autorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const solicitud = await tx.solicitudInsumos.create({
        data: {
          contratoId: dto.contratoId,
          solicitante: dto.solicitante,
          fechaNecesaria: dto.fechaNecesaria ? new Date(dto.fechaNecesaria) : null,
          origen: dto.origen,
          motivo: dto.motivo,
          notas: dto.notas,
          items: {
            create: dto.items.map((item) => ({
              insumoId: item.insumoId,
              cantidadSolicitada: item.cantidadSolicitada,
              observacion: item.observacion,
            })),
          },
        },
      });
      await this.bitacora.registrar(
        { entidad: 'SolicitudInsumos', entidadId: solicitud.id, accion: 'CREAR', usuarioId: autorId, detalle: { items: dto.items.length } },
        tx,
      );
      return this.obtener(solicitud.id);
    });
  }

  async actualizar(id: string, dto: ActualizarSolicitudDto, autorId: string) {
    const actual = await this.prisma.solicitudInsumos.findUniqueOrThrow({ where: { id } });
    return this.prisma.$transaction(async (tx) => {
      const solicitud = await tx.solicitudInsumos.update({
        where: { id },
        data: {
          estado: dto.estado,
          aprobadoPor: dto.aprobadoPor,
          notas: dto.notas,
          fechaAprobacion: dto.estado === 'APROBADA' ? new Date() : actual.fechaAprobacion,
        },
      });
      await this.bitacora.registrar(
        { entidad: 'SolicitudInsumos', entidadId: id, accion: 'EDITAR', usuarioId: autorId, detalle: { antes: { estado: actual.estado }, despues: dto } },
        tx,
      );
      return this.obtener(id);
    });
  }
}
