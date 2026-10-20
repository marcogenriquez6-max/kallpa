import { Injectable, ConflictException } from '@nestjs/common';
import { BitacoraService } from '../bitacora/bitacora.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarInsumoDto, CrearInsumoDto } from './insumos.dto';

@Injectable()
export class InsumosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  listar(filtro?: { activo?: string; categoriaId?: string }) {
    const where: any = {};
    if (filtro?.activo !== undefined && filtro?.activo !== '') where.activo = filtro.activo === 'true';
    if (filtro?.categoriaId) where.categoriaId = filtro.categoriaId;
    return this.prisma.insumo.findMany({
      where,
      orderBy: { nombre: 'asc' },
      include: { categoria: true, unidadCompraRef: true, unidadConsumoRef: true },
    });
  }

  async obtener(id: string) {
    return this.prisma.insumo.findUniqueOrThrow({
      where: { id },
      include: { categoria: true, unidadCompraRef: true, unidadConsumoRef: true, proveedorInsumos: { include: { proveedor: true } } },
    });
  }

  async crear(dto: CrearInsumoDto, autorId: string) {
    const nombre = dto.nombre.trim();
    if (await this.prisma.insumo.findFirst({ where: { nombre } })) {
      throw new ConflictException('Ya existe an insumo con ese nombre');
    }
    return this.prisma.$transaction(async (tx) => {
      const insumo = await tx.insumo.create({ data: { ...dto, nombre, factorConversion: dto.factorConversion ?? 1 } });
      await this.bitacora.registrar(
        { entidad: 'Insumo', entidadId: insumo.id, accion: 'CREAR', usuarioId: autorId, detalle: { nombre: insumo.nombre } },
        tx,
      );
      return this.obtener(insumo.id);
    });
  }

  async actualizar(id: string, dto: ActualizarInsumoDto, autorId: string) {
    const actual = await this.prisma.insumo.findUniqueOrThrow({ where: { id } });
    return this.prisma.$transaction(async (tx) => {
      const insumo = await tx.insumo.update({ where: { id }, data: dto });
      await this.bitacora.registrar(
        { entidad: 'Insumo', entidadId: id, accion: 'EDITAR', usuarioId: autorId, detalle: { antes: { nombre: actual.nombre, activo: actual.activo }, despues: dto } },
        tx,
      );
      return this.obtener(id);
    });
  }
}
