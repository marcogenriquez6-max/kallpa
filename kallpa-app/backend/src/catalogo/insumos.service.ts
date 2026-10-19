import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BitacoraService } from '../bitacora/bitacora.service';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarInsumoDto, CrearInsumoDto } from './dto/insumo.dto';

export interface FiltroInsumo {
  categoriaId?: number;
  activo?: boolean;
  q?: string;
}

@Injectable()
export class InsumosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  listar(filtro: FiltroInsumo) {
    return this.prisma.insumo.findMany({
      where: {
        categoriaId: filtro.categoriaId,
        activo: filtro.activo,
        ...(filtro.q ? { nombre: { contains: filtro.q, mode: 'insensitive' as const } } : {}),
      },
      orderBy: { nombre: 'asc' },
      include: {
        categoria: true,
        unidadBase: true,
        unidadCompra: true,
        _count: { select: { fichaLineas: true } },
      },
    });
  }

  obtener(id: string) {
    return this.prisma.insumo.findUniqueOrThrow({
      where: { id },
      include: {
        categoria: true,
        unidadBase: true,
        unidadCompra: true,
        fichaLineas: { select: { id: true, fichaId: true } },
      },
    });
  }

  async crear(dto: CrearInsumoDto, autorId: string) {
    const nombre = dto.nombre.trim();
    if (await this.prisma.insumo.findUnique({ where: { nombre } })) {
      throw new ConflictException(`Ya existe el insumo «${nombre}»`);
    }
    return this.prisma.$transaction(async (tx) => {
      const insumo = await tx.insumo.create({
        data: {
          nombre,
          categoriaId: dto.categoriaId,
          unidadBaseCodigo: dto.unidadBaseCodigo,
          unidadCompraCodigo: dto.unidadCompraCodigo?.trim() || null,
          pesoUnitarioGramos: dto.pesoUnitarioGramos ?? null,
          especificacionHabitual: dto.especificacionHabitual?.trim() || null,
          marcaPreferida: dto.marcaPreferida?.trim() || null,
          perecible: dto.perecible ?? true,
          requiereFrio: dto.requiereFrio ?? false,
          stockMinimo: dto.stockMinimo ?? 0,
          activo: dto.activo ?? true,
        },
      });
      await this.bitacora.registrar(
        {
          entidad: 'Insumo',
          entidadId: insumo.id,
          accion: 'CREAR',
          usuarioId: autorId,
          detalle: { nombre: insumo.nombre, categoriaId: insumo.categoriaId },
        },
        tx,
      );
      return insumo;
    });
  }

  async actualizar(id: string, dto: ActualizarInsumoDto, autorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const anterior = await tx.insumo.findUnique({ where: { id } });
      if (!anterior) throw new NotFoundException(`No existe el insumo ${id}`);

      const data: Prisma.InsumoUncheckedUpdateInput = {};
      if (dto.nombre !== undefined) data.nombre = dto.nombre.trim();
      if (dto.categoriaId !== undefined) data.categoriaId = dto.categoriaId;
      if (dto.unidadBaseCodigo !== undefined) data.unidadBaseCodigo = dto.unidadBaseCodigo;
      if (dto.unidadCompraCodigo !== undefined) {
        data.unidadCompraCodigo = dto.unidadCompraCodigo.trim() || null;
      }
      if (dto.pesoUnitarioGramos !== undefined) data.pesoUnitarioGramos = dto.pesoUnitarioGramos;
      if (dto.especificacionHabitual !== undefined) {
        data.especificacionHabitual = dto.especificacionHabitual.trim() || null;
      }
      if (dto.marcaPreferida !== undefined) data.marcaPreferida = dto.marcaPreferida.trim() || null;
      if (dto.perecible !== undefined) data.perecible = dto.perecible;
      if (dto.requiereFrio !== undefined) data.requiereFrio = dto.requiereFrio;
      if (dto.stockMinimo !== undefined) data.stockMinimo = dto.stockMinimo;
      if (dto.activo !== undefined) data.activo = dto.activo;

      const insumo = await tx.insumo.update({ where: { id }, data });
      await this.bitacora.registrar(
        {
          entidad: 'Insumo',
          entidadId: id,
          accion: 'EDITAR',
          usuarioId: autorId,
          detalle: {
            antes: { nombre: anterior.nombre },
            despues: dto as unknown as Prisma.InputJsonValue,
          },
        },
        tx,
      );
      return insumo;
    });
  }
}
