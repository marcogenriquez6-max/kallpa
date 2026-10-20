import { Injectable, ConflictException } from '@nestjs/common';
import { BitacoraService } from '../bitacora/bitacora.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarClienteDto, CrearClienteDto } from './clientes.dto';

@Injectable()
export class ClientesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  listar(filtro?: { activo?: string; tipo?: string }) {
    const where: any = {};
    if (filtro?.activo !== undefined && filtro?.activo !== '') where.activo = filtro.activo === 'true';
    if (filtro?.tipo) where.tipo = filtro.tipo;
    return this.prisma.cliente.findMany({ where, orderBy: { razonSocial: 'asc' } });
  }

  async obtener(id: string) {
    return this.prisma.cliente.findUniqueOrThrow({ where: { id }, include: { contratos: { orderBy: { fechaEvento: 'desc' } } } });
  }

  async crear(dto: CrearClienteDto, autorId: string) {
    if (dto.nitCi) {
      const existe = await this.prisma.cliente.findFirst({ where: { nitCi: dto.nitCi } });
      if (existe) throw new ConflictException('Ya existe un cliente con ese NIT/CI');
    }
    return this.prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.create({ data: dto });
      await this.bitacora.registrar(
        { entidad: 'Cliente', entidadId: cliente.id, accion: 'CREAR', usuarioId: autorId, detalle: { razonSocial: cliente.razonSocial, tipo: cliente.tipo } },
        tx,
      );
      return cliente;
    });
  }

  async actualizar(id: string, dto: ActualizarClienteDto, autorId: string) {
    const actual = await this.prisma.cliente.findUniqueOrThrow({ where: { id } });
    if (dto.nitCi && dto.nitCi !== actual.nitCi) {
      const existe = await this.prisma.cliente.findFirst({ where: { nitCi: dto.nitCi } });
      if (existe) throw new ConflictException('Ya existe un cliente con ese NIT/CI');
    }
    return this.prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.update({ where: { id }, data: dto });
      await this.bitacora.registrar(
        { entidad: 'Cliente', entidadId: id, accion: 'EDITAR', usuarioId: autorId, detalle: { antes: { razonSocial: actual.razonSocial }, despues: dto } },
        tx,
      );
      return cliente;
    });
  }
}
