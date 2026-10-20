import { Injectable, ConflictException } from '@nestjs/common';
import { BitacoraService } from '../bitacora/bitacora.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarCategoriaInsumoDto, CrearCategoriaInsumoDto } from './categorias-insumo.dto';

@Injectable()
export class CategoriasInsumoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  listar() {
    return this.prisma.categoriaInsumo.findMany({ orderBy: { nombre: 'asc' } });
  }

  async crear(dto: CrearCategoriaInsumoDto, autorId: string) {
    if (await this.prisma.categoriaInsumo.findUnique({ where: { nombre: dto.nombre.trim() } })) {
      throw new ConflictException('Ya existe una categoría con ese nombre');
    }
    return this.prisma.$transaction(async (tx) => {
      const cat = await tx.categoriaInsumo.create({ data: { nombre: dto.nombre.trim(), activo: dto.activo ?? true } });
      await this.bitacora.registrar(
        { entidad: 'CategoriaInsumo', entidadId: cat.id, accion: 'CREAR', usuarioId: autorId, detalle: { nombre: cat.nombre } },
        tx,
      );
      return cat;
    });
  }

  async actualizar(id: string, dto: ActualizarCategoriaInsumoDto, autorId: string) {
    const actual = await this.prisma.categoriaInsumo.findUniqueOrThrow({ where: { id } });
    return this.prisma.$transaction(async (tx) => {
      const cat = await tx.categoriaInsumo.update({ where: { id }, data: dto });
      await this.bitacora.registrar(
        { entidad: 'CategoriaInsumo', entidadId: id, accion: 'EDITAR', usuarioId: autorId, detalle: { antes: actual, despues: dto } },
        tx,
      );
      return cat;
    });
  }
}
