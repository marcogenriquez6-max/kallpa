import { Injectable, NotFoundException } from '@nestjs/common';
import { BitacoraService } from '../bitacora/bitacora.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarItemCatalogoDto } from './dto/actualizar-item.dto';
import { CrearItemCatalogoDto } from './dto/crear-item.dto';
import { GuardarFichaTecnicaDto } from './dto/ficha-tecnica.dto';

@Injectable()
export class CatalogoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  listar(filtro?: { tipo?: string; linea?: string; activo?: string }) {
    const where: any = {};
    if (filtro?.tipo) where.tipo = filtro.tipo;
    if (filtro?.linea) where.linea = filtro.linea;
    if (filtro?.activo !== undefined && filtro?.activo !== '') where.activo = filtro.activo === 'true';
    return this.prisma.itemCatalogo.findMany({
      where,
      orderBy: { nombre: 'asc' },
      include: { fichaTecnica: { include: { lineas: { include: { insumo: true } } } } },
    });
  }

  async obtener(id: string) {
    const item = await this.prisma.itemCatalogo.findUnique({
      where: { id },
      include: { fichaTecnica: { include: { lineas: { include: { insumo: true } } } } },
    });
    if (!item) throw new NotFoundException('Ítem del catálogo no encontrado');
    return item;
  }

  async crear(dto: CrearItemCatalogoDto, autorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.itemCatalogo.create({ data: dto });
      await this.bitacora.registrar(
        { entidad: 'ItemCatalogo', entidadId: item.id, accion: 'CREAR', usuarioId: autorId, detalle: { nombre: item.nombre } },
        tx,
      );
      return this.obtener(item.id);
    });
  }

  async actualizar(id: string, dto: ActualizarItemCatalogoDto, autorId: string) {
    const actual = await this.prisma.itemCatalogo.findUniqueOrThrow({ where: { id } });
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.itemCatalogo.update({ where: { id }, data: dto });
      await this.bitacora.registrar(
        {
          entidad: 'ItemCatalogo',
          entidadId: id,
          accion: 'EDITAR',
          usuarioId: autorId,
          detalle: { antes: { nombre: actual.nombre, activo: actual.activo }, despues: dto },
        },
        tx,
      );
      return this.obtener(id);
    });
  }

  async guardarFichaTecnica(itemId: string, dto: GuardarFichaTecnicaDto, autorId: string) {
    await this.prisma.itemCatalogo.findUniqueOrThrow({ where: { id: itemId } });
    return this.prisma.$transaction(async (tx) => {
      const ficha = await tx.fichaTecnica.upsert({
        where: { itemCatalogoId: itemId },
        create: { itemCatalogoId: itemId },
        update: {},
      });
      await tx.fichaTecnicaLinea.deleteMany({ where: { fichaTecnicaId: ficha.id } });
      if (dto.lineas && dto.lineas.length > 0) {
        await tx.fichaTecnicaLinea.createMany({
          data: dto.lineas.map((l) => ({
            fichaTecnicaId: ficha.id,
            insumoId: l.insumoId,
            cantidadBruta: l.cantidadBruta,
            observacion: l.observacion,
          })),
        });
      }
      await this.bitacora.registrar(
        { entidad: 'FichaTecnica', entidadId: ficha.id, accion: 'EDITAR', usuarioId: autorId, detalle: { itemCatalogoId: itemId, lineas: dto.lineas?.length ?? 0 } },
        tx,
      );
      return this.obtener(itemId);
    });
  }
}
