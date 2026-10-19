import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BitacoraService } from '../bitacora/bitacora.service';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarCategoriaDto, CrearCategoriaDto } from './dto/categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  listar() {
    return this.prisma.categoriaInsumo.findMany({
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
      include: { _count: { select: { insumos: true } } },
    });
  }

  async crear(dto: CrearCategoriaDto, autorId: string) {
    const nombre = dto.nombre.trim();
    if (await this.prisma.categoriaInsumo.findUnique({ where: { nombre } })) {
      throw new ConflictException(`Ya existe la categoría «${nombre}»`);
    }
    return this.prisma.$transaction(async (tx) => {
      const categoria = await tx.categoriaInsumo.create({
        data: { nombre, orden: dto.orden ?? 0 },
      });
      await this.bitacora.registrar(
        {
          entidad: 'CategoriaInsumo',
          entidadId: String(categoria.id),
          accion: 'CREAR',
          usuarioId: autorId,
          detalle: { nombre: categoria.nombre, orden: categoria.orden },
        },
        tx,
      );
      return categoria;
    });
  }

  async actualizar(id: number, dto: ActualizarCategoriaDto, autorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const anterior = await tx.categoriaInsumo.findUnique({ where: { id } });
      if (!anterior) throw new NotFoundException(`No existe la categoría ${id}`);

      const categoria = await tx.categoriaInsumo.update({
        where: { id },
        data: { nombre: dto.nombre?.trim(), orden: dto.orden },
      });
      await this.bitacora.registrar(
        {
          entidad: 'CategoriaInsumo',
          entidadId: String(id),
          accion: 'EDITAR',
          usuarioId: autorId,
          detalle: {
            antes: { nombre: anterior.nombre, orden: anterior.orden },
            despues: dto as unknown as Prisma.InputJsonValue,
          },
        },
        tx,
      );
      return categoria;
    });
  }
}
