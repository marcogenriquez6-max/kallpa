import { Injectable, ConflictException } from '@nestjs/common';
import { BitacoraService } from '../bitacora/bitacora.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarProveedorDto, AgregarProveedorInsumoDto, CrearProveedorDto } from './proveedores.dto';

@Injectable()
export class ProveedoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  listar(filtro?: { activo?: string }) {
    const where: any = {};
    if (filtro?.activo !== undefined && filtro?.activo !== '') where.activo = filtro.activo === 'true';
    return this.prisma.proveedor.findMany({ where, orderBy: { razonSocial: 'asc' } });
  }

  async obtener(id: string) {
    return this.prisma.proveedor.findUniqueOrThrow({
      where: { id },
      include: {
        insumos: { include: { insumo: { include: { unidadCompraRef: true } } } },
        compras: { orderBy: { fechaEmision: 'desc' }, take: 20 },
      },
    });
  }

  async crear(dto: CrearProveedorDto, autorId: string) {
    if (dto.nit) {
      const existe = await this.prisma.proveedor.findFirst({ where: { nit: dto.nit } });
      if (existe) throw new ConflictException('Ya existe un proveedor con ese NIT');
    }
    return this.prisma.$transaction(async (tx) => {
      const proveedor = await tx.proveedor.create({ data: dto });
      await this.bitacora.registrar(
        { entidad: 'Proveedor', entidadId: proveedor.id, accion: 'CREAR', usuarioId: autorId, detalle: { razonSocial: proveedor.razonSocial } },
        tx,
      );
      return proveedor;
    });
  }

  async actualizar(id: string, dto: ActualizarProveedorDto, autorId: string) {
    const actual = await this.prisma.proveedor.findUniqueOrThrow({ where: { id } });
    if (dto.nit && dto.nit !== actual.nit) {
      const existe = await this.prisma.proveedor.findFirst({ where: { nit: dto.nit } });
      if (existe) throw new ConflictException('Ya existe un proveedor con ese NIT');
    }
    return this.prisma.$transaction(async (tx) => {
      const proveedor = await tx.proveedor.update({ where: { id }, data: dto });
      await this.bitacora.registrar(
        { entidad: 'Proveedor', entidadId: id, accion: 'EDITAR', usuarioId: autorId, detalle: { antes: { razonSocial: actual.razonSocial }, despues: dto } },
        tx,
      );
      return proveedor;
    });
  }

  async agregarInsumo(id: string, dto: AgregarProveedorInsumoDto, autorId: string) {
    await this.prisma.proveedor.findUniqueOrThrow({ where: { id } });
    await this.prisma.insumo.findUniqueOrThrow({ where: { id: dto.insumoId } });
    return this.prisma.$transaction(async (tx) => {
      const rel = await tx.proveedorInsumo.upsert({
        where: { proveedorId_insumoId: { proveedorId: id, insumoId: dto.insumoId } },
        create: { proveedorId: id, insumoId: dto.insumoId, ...dto },
        update: { ...dto },
      });
      await this.bitacora.registrar(
        { entidad: 'ProveedorInsumo', entidadId: rel.id, accion: 'CREAR', usuarioId: autorId, detalle: { proveedorId: id, insumoId: dto.insumoId } },
        tx,
      );
      return this.obtener(id);
    });
  }

  async quitarInsumo(id: string, insumoId: string, autorId: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.proveedorInsumo.delete({ where: { proveedorId_insumoId: { proveedorId: id, insumoId } } });
      await this.bitacora.registrar(
        { entidad: 'ProveedorInsumo', entidadId: `${id}-${insumoId}`, accion: 'ELIMINAR', usuarioId: autorId, detalle: {} },
        tx,
      );
    });
    return this.obtener(id);
  }
}
