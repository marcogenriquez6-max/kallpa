import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BitacoraService } from '../bitacora/bitacora.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarContratoDto, CrearContratoDto } from './contratos.dto';

@Injectable()
export class ContratosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  listar(filtro?: { estado?: string; clienteId?: string }) {
    const where: any = {};
    if (filtro?.estado) where.estado = filtro.estado;
    if (filtro?.clienteId) where.clienteId = filtro.clienteId;
    return this.prisma.contrato.findMany({
      where,
      orderBy: { fechaEvento: 'desc' },
      include: { cliente: true, items: { include: { itemCatalogo: true } }, pagos: true },
    });
  }

  async obtener(id: string) {
    const contrato = await this.prisma.contrato.findUnique({
      where: { id },
      include: { cliente: true, items: { include: { itemCatalogo: true } }, pagos: true, solicitudes: true },
    });
    if (!contrato) throw new NotFoundException('Contrato no encontrado');
    return contrato;
  }

  async crear(dto: CrearContratoDto, autorId: string) {
    const existe = await this.prisma.contrato.findUnique({ where: { codigo: dto.codigo } });
    if (existe) throw new BadRequestException('Ya existe un contrato con ese código');
    return this.prisma.$transaction(async (tx) => {
      let subtotalGeneral = 0;
      for (const item of dto.items) {
        subtotalGeneral += item.cantidad * item.precioUnitario;
      }
      const descuento = dto.descuento ?? 0;
      const montoGarantia = dto.montoGarantia ?? 0;
      const total = Math.max(0, subtotalGeneral - descuento);

      const contrato = await tx.contrato.create({
        data: {
          clienteId: dto.clienteId,
          codigo: dto.codigo,
          fechaEvento: new Date(dto.fechaEvento),
          horaInicio: dto.horaInicio ? new Date(dto.horaInicio) : null,
          lugar: dto.lugar,
          invitados: dto.invitados,
          estado: dto.estado ?? 'COTIZACION',
          montoGarantia,
          descuento,
          total,
          observaciones: dto.observaciones,
          items: {
            create: dto.items.map((item) => ({
              itemCatalogoId: item.itemCatalogoId,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              subtotal: item.cantidad * item.precioUnitario,
              observacion: item.observacion,
            })),
          },
        },
      });
      await this.bitacora.registrar(
        { entidad: 'Contrato', entidadId: contrato.id, accion: 'CREAR', usuarioId: autorId, detalle: { codigo: contrato.codigo, total } },
        tx,
      );
      return this.obtener(contrato.id);
    });
  }

  async actualizar(id: string, dto: ActualizarContratoDto, autorId: string) {
    const actual = await this.prisma.contrato.findUniqueOrThrow({ where: { id }, include: { items: true } });
    return this.prisma.$transaction(async (tx) => {
      const contrato = await tx.contrato.update({
        where: { id },
        data: {
          fechaEvento: dto.fechaEvento ? new Date(dto.fechaEvento) : undefined,
          horaInicio: dto.horaInicio !== undefined ? (dto.horaInicio ? new Date(dto.horaInicio) : null) : undefined,
          lugar: dto.lugar,
          invitados: dto.invitados,
          estado: dto.estado,
          montoGarantia: dto.montoGarantia,
          descuento: dto.descuento,
          observaciones: dto.observaciones,
        },
      });

      if (dto.items) {
        let subtotalGeneral = 0;
        for (const item of dto.items) {
          subtotalGeneral += item.cantidad * item.precioUnitario;
        }
        const descuento = dto.descuento ?? actual.descuento?.toNumber?.() ?? 0;
        const total = Math.max(0, subtotalGeneral - descuento);

        await tx.contratoItem.deleteMany({ where: { contratoId: id } });
        await tx.contratoItem.createMany({
          data: dto.items.map((item) => ({
            contratoId: id,
            itemCatalogoId: item.itemCatalogoId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.cantidad * item.precioUnitario,
            observacion: item.observacion,
          })),
        });
        await tx.contrato.update({ where: { id }, data: { total } });
      }

      await this.bitacora.registrar(
        { entidad: 'Contrato', entidadId: id, accion: 'EDITAR', usuarioId: autorId, detalle: { antes: { estado: actual.estado }, despues: dto } },
        tx,
      );
      return this.obtener(id);
    });
  }
}
