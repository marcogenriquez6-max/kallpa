import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BitacoraService } from '../bitacora/bitacora.service';
import { LineaCatalogo, TipoItemCatalogo } from '../generated/prisma/enums';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ActualizarItemCatalogoDto,
  CrearItemCatalogoDto,
} from './dto/item-catalogo.dto';
import { CrearFichaDto } from './dto/ficha.dto';

export interface FiltroItem {
  tipo?: TipoItemCatalogo;
  linea?: LineaCatalogo;
  activo?: boolean;
  q?: string;
}

/** Redondeo comercial a dos decimales (evita 0.30000000000000004). */
export function aBs(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

@Injectable()
export class CatalogoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  // ------------------------------------------------------------------
  // Ítems del catálogo
  // ------------------------------------------------------------------

  async listarItems(filtro: FiltroItem) {
    const items = await this.prisma.itemCatalogo.findMany({
      where: {
        tipo: filtro.tipo,
        linea: filtro.linea,
        activo: filtro.activo,
        ...(filtro.q
          ? {
              OR: [
                { nombre: { contains: filtro.q, mode: 'insensitive' as const } },
                { codigo: { contains: filtro.q, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      orderBy: [{ tipo: 'asc' }, { codigo: 'asc' }],
      include: { fichas: { where: { vigente: true }, select: { id: true, version: true } } },
    });
    return items.map(({ fichas, ...item }) => ({ ...item, fichaVigente: fichas[0] ?? null }));
  }

  obtenerItem(id: string) {
    return this.prisma.itemCatalogo.findUniqueOrThrow({
      where: { id },
      include: {
        fichas: {
          orderBy: { version: 'desc' },
          include: { _count: { select: { lineas: true } } },
        },
      },
    });
  }

  async crearItem(dto: CrearItemCatalogoDto, autorId: string) {
    const codigo = dto.codigo.toUpperCase().trim();
    if (await this.prisma.itemCatalogo.findUnique({ where: { codigo } })) {
      throw new ConflictException(`Ya existe un ítem con el código ${codigo}`);
    }
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.itemCatalogo.create({
        data: {
          codigo,
          nombre: dto.nombre.trim(),
          descripcion: dto.descripcion?.trim() || null,
          tipo: dto.tipo,
          linea: dto.linea ?? null,
          precioVenta: dto.precioVenta,
          activo: dto.activo ?? true,
        },
      });
      await this.bitacora.registrar(
        {
          entidad: 'ItemCatalogo',
          entidadId: item.id,
          accion: 'CREAR',
          usuarioId: autorId,
          detalle: {
            codigo: item.codigo,
            nombre: item.nombre,
            tipo: item.tipo,
            precioVenta: item.precioVenta.toString(),
          },
        },
        tx,
      );
      return item;
    });
  }

  async actualizarItem(id: string, dto: ActualizarItemCatalogoDto, autorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const anterior = await tx.itemCatalogo.findUnique({ where: { id } });
      if (!anterior) throw new NotFoundException(`No existe el ítem ${id}`);

      const data: Prisma.ItemCatalogoUncheckedUpdateInput = {};
      if (dto.codigo !== undefined) data.codigo = dto.codigo.toUpperCase().trim();
      if (dto.nombre !== undefined) data.nombre = dto.nombre.trim();
      if (dto.descripcion !== undefined) data.descripcion = dto.descripcion.trim() || null;
      if (dto.tipo !== undefined) data.tipo = dto.tipo;
      if (dto.linea !== undefined) data.linea = dto.linea;
      if (dto.precioVenta !== undefined) data.precioVenta = dto.precioVenta;
      if (dto.activo !== undefined) data.activo = dto.activo;

      const item = await tx.itemCatalogo.update({ where: { id }, data });
      await this.bitacora.registrar(
        {
          entidad: 'ItemCatalogo',
          entidadId: id,
          accion: 'EDITAR',
          usuarioId: autorId,
          detalle: {
            antes: { nombre: anterior.nombre, precioVenta: anterior.precioVenta.toString() },
            despues: dto as unknown as Prisma.InputJsonValue,
          },
        },
        tx,
      );
      return item;
    });
  }

  // ------------------------------------------------------------------
  // Fichas técnicas (versionadas)
  // ------------------------------------------------------------------

  async listarFichas(itemId: string) {
    await this.prisma.itemCatalogo.findUniqueOrThrow({ where: { id: itemId } });
    return this.prisma.fichaTecnica.findMany({
      where: { itemId },
      orderBy: { version: 'desc' },
      include: { _count: { select: { lineas: true } } },
    });
  }

  obtenerFicha(id: string) {
    return this.prisma.fichaTecnica.findUniqueOrThrow({
      where: { id },
      include: {
        item: { select: { id: true, codigo: true, nombre: true, precioVenta: true } },
        lineas: { include: { insumo: true, unidad: true }, orderBy: { id: 'asc' } },
      },
    });
  }

  /**
   * Crea una nueva versión vigente de la ficha. La versión anterior se marca
   * como no vigente: los contratos ya planificados conservan su receta.
   */
  async crearFicha(itemId: string, dto: CrearFichaDto, autorId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.itemCatalogo.findUniqueOrThrow({ where: { id: itemId } });
      const ultima = await tx.fichaTecnica.findFirst({
        where: { itemId },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      const version = (ultima?.version ?? 0) + 1;

      await tx.fichaTecnica.updateMany({ where: { itemId }, data: { vigente: false } });
      const ficha = await tx.fichaTecnica.create({
        data: {
          itemId,
          version,
          vigente: true,
          porcionGramos: dto.porcionGramos ?? null,
          procedimiento: dto.procedimiento?.trim() || null,
          lineas: {
            create: dto.lineas.map((l) => ({
              insumoId: l.insumoId,
              cantidadPorPorcion: l.cantidadPorPorcion,
              unidadCodigo: l.unidadCodigo,
              porcentajeMerma: l.porcentajeMerma ?? 0,
              aCriterio: l.aCriterio ?? false,
              especificacion: l.especificacion?.trim() || null,
            })),
          },
        },
        include: { lineas: { include: { insumo: true, unidad: true } } },
      });

      await this.bitacora.registrar(
        {
          entidad: 'FichaTecnica',
          entidadId: ficha.id,
          accion: 'CREAR',
          usuarioId: autorId,
          detalle: { itemId, version, lineas: ficha.lineas.length },
        },
        tx,
      );
      return ficha;
    });
  }

  /**
   * Costeo teórico por porción usando el último precio de referencia de cada
   * insumo (ProveedorInsumo). Marca `completo = false` cuando falta un precio
   * o la cantidad quedó a criterio del cocinero.
   */
  async costoFicha(id: string) {
    const ficha = await this.prisma.fichaTecnica.findUniqueOrThrow({
      where: { id },
      include: {
        item: { select: { id: true, codigo: true, nombre: true, precioVenta: true } },
        lineas: { include: { insumo: true, unidad: true } },
      },
    });

    const detalle: Array<{
      insumoId: string;
      insumo: string;
      cantidad: number | null;
      unidad: string;
      costo: number | null;
      motivo?: string;
    }> = [];
    let total = 0;
    let completo = true;

    for (const linea of ficha.lineas) {
      if (linea.aCriterio || linea.cantidadPorPorcion == null) {
        completo = false;
        detalle.push({
          insumoId: linea.insumoId,
          insumo: linea.insumo.nombre,
          cantidad: null,
          unidad: linea.unidad.codigo,
          costo: null,
          motivo: 'a criterio',
        });
        continue;
      }

      const precio = await this.prisma.proveedorInsumo.findFirst({
        where: { insumoId: linea.insumoId },
        orderBy: { fecha: 'desc' },
      });
      if (!precio) {
        completo = false;
        detalle.push({
          insumoId: linea.insumoId,
          insumo: linea.insumo.nombre,
          cantidad: Number(linea.cantidadPorPorcion),
          unidad: linea.unidad.codigo,
          costo: null,
          motivo: 'sin precio de referencia',
        });
        continue;
      }

      const cantidadBase = Number(linea.cantidadPorPorcion) * Number(linea.unidad.factorBase);
      const factorMerma = 1 + Number(linea.porcentajeMerma) / 100;
      const costo = cantidadBase * Number(precio.precioUnitario) * factorMerma;
      total += costo;
      detalle.push({
        insumoId: linea.insumoId,
        insumo: linea.insumo.nombre,
        cantidad: Number(linea.cantidadPorPorcion),
        unidad: linea.unidad.codigo,
        costo: aBs(costo),
      });
    }

    const precioVenta = Number(ficha.item.precioVenta);
    const costoPorcion = aBs(total);
    return {
      fichaId: ficha.id,
      version: ficha.version,
      item: ficha.item,
      completo,
      costoPorcion,
      precioVenta,
      margen: aBs(precioVenta - costoPorcion),
      margenPorcentaje: precioVenta > 0 ? aBs(((precioVenta - costoPorcion) / precioVenta) * 100) : null,
      detalle,
    };
  }
}
