import { Injectable } from '@nestjs/common';
import { BitacoraService } from '../bitacora/bitacora.service';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarClienteDto, CrearClienteDto } from './dto/cliente.dto';

/** Personas o empresas que contratan los eventos. */
@Injectable()
export class ClientesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  listar(q?: string) {
    return this.prisma.cliente.findMany({
      where: q
        ? {
            OR: [
              { nombre: { contains: q, mode: 'insensitive' as const } },
              { telefono: { contains: q } },
              { ci: { contains: q } },
              { nit: { contains: q } },
            ],
          }
        : undefined,
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { contratos: true } } },
    });
  }

  obtener(id: string) {
    return this.prisma.cliente.findUniqueOrThrow({
      where: { id },
      include: {
        contratos: {
          orderBy: { fechaEvento: 'desc' },
          select: {
            id: true,
            codigo: true,
            fechaEvento: true,
            estado: true,
            precioTotal: true,
          },
        },
      },
    });
  }

  async crear(dto: CrearClienteDto, autorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.create({
        data: {
          nombre: dto.nombre.trim(),
          ci: dto.ci?.trim() || null,
          nit: dto.nit?.trim() || null,
          razonSocial: dto.razonSocial?.trim() || null,
          telefono: dto.telefono.trim(),
          email: dto.email?.trim().toLowerCase() || null,
          tipo: dto.tipo,
        },
      });
      await this.bitacora.registrar(
        {
          entidad: 'Cliente',
          entidadId: cliente.id,
          accion: 'CREAR',
          usuarioId: autorId,
          detalle: { nombre: cliente.nombre, tipo: cliente.tipo },
        },
        tx,
      );
      return cliente;
    });
  }

  async actualizar(id: string, dto: ActualizarClienteDto, autorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const anterior = await tx.cliente.findUniqueOrThrow({ where: { id } });

      const data: Prisma.ClienteUncheckedUpdateInput = {};
      if (dto.nombre !== undefined) data.nombre = dto.nombre.trim();
      if (dto.ci !== undefined) data.ci = dto.ci.trim() || null;
      if (dto.nit !== undefined) data.nit = dto.nit.trim() || null;
      if (dto.razonSocial !== undefined) data.razonSocial = dto.razonSocial.trim() || null;
      if (dto.telefono !== undefined) data.telefono = dto.telefono.trim();
      if (dto.email !== undefined) data.email = dto.email.trim().toLowerCase() || null;
      if (dto.tipo !== undefined) data.tipo = dto.tipo;

      const cliente = await tx.cliente.update({ where: { id }, data });
      await this.bitacora.registrar(
        {
          entidad: 'Cliente',
          entidadId: id,
          accion: 'EDITAR',
          usuarioId: autorId,
          detalle: {
            antes: { nombre: anterior.nombre, tipo: anterior.tipo },
            despues: dto as unknown as Prisma.InputJsonValue,
          },
        },
        tx,
      );
      return cliente;
    });
  }
}
