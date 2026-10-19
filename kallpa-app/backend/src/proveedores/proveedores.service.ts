import { BadRequestException, Injectable } from '@nestjs/common';
import { BitacoraService } from '../bitacora/bitacora.service';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegistrarPrecioDto } from './dto/precio.dto';
import { ActualizarProveedorDto, CrearProveedorDto } from './dto/proveedor.dto';

/** Proveedores e historial de precios por insumo. */
@Injectable()
export class ProveedoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  listar(filtro: { activo?: boolean; q?: string }) {
    return this.prisma.proveedor.findMany({
      where: {
        activo: filtro.activo,
        ...(filtro.q
          ? {
              OR: [
                { razonSocial: { contains: filtro.q, mode: 'insensitive' as const } },
                { nombreContacto: { contains: filtro.q, mode: 'insensitive' as const } },
                { nitOCi: { contains: filtro.q } },
                { telefono: { contains: filtro.q } },
                { whatsapp: { contains: filtro.q } },
                { ubicacionMercado: { contains: filtro.q, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      orderBy: { razonSocial: 'asc' },
      include: { _count: { select: { insumos: true, compras: true } } },
    });
  }

  obtener(id: string) {
    return this.prisma.proveedor.findUniqueOrThrow({
      where: { id },
      include: {
        insumos: {
          orderBy: { fecha: 'desc' },
          take: 200,
          include: {
            insumo: {
              select: { id: true, nombre: true, unidadBaseCodigo: true, categoriaId: true },
            },
          },
        },
        _count: { select: { compras: true } },
      },
    });
  }

  async crear(dto: CrearProveedorDto, autorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const proveedor = await tx.proveedor.create({
        data: {
          razonSocial: dto.razonSocial.trim(),
          nombreContacto: dto.nombreContacto?.trim() || null,
          nitOCi: dto.nitOCi?.trim() || null,
          telefono: dto.telefono?.trim() || null,
          whatsapp: dto.whatsapp?.trim() || null,
          direccion: dto.direccion?.trim() || null,
          ubicacionMercado: dto.ubicacionMercado?.trim() || null,
          condicionPago: dto.condicionPago,
          emiteFactura: dto.emiteFactura ?? false,
          calificacion: dto.calificacion ?? null,
          observaciones: dto.observaciones?.trim() || null,
          activo: dto.activo ?? true,
        },
      });
      await this.bitacora.registrar(
        {
          entidad: 'Proveedor',
          entidadId: proveedor.id,
          accion: 'CREAR',
          usuarioId: autorId,
          detalle: { razonSocial: proveedor.razonSocial },
        },
        tx,
      );
      return proveedor;
    });
  }

  async actualizar(id: string, dto: ActualizarProveedorDto, autorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const anterior = await tx.proveedor.findUniqueOrThrow({ where: { id } });

      const data: Prisma.ProveedorUncheckedUpdateInput = {};
      if (dto.razonSocial !== undefined) data.razonSocial = dto.razonSocial.trim();
      if (dto.nombreContacto !== undefined) data.nombreContacto = dto.nombreContacto.trim() || null;
      if (dto.nitOCi !== undefined) data.nitOCi = dto.nitOCi.trim() || null;
      if (dto.telefono !== undefined) data.telefono = dto.telefono.trim() || null;
      if (dto.whatsapp !== undefined) data.whatsapp = dto.whatsapp.trim() || null;
      if (dto.direccion !== undefined) data.direccion = dto.direccion.trim() || null;
      if (dto.ubicacionMercado !== undefined) {
        data.ubicacionMercado = dto.ubicacionMercado.trim() || null;
      }
      if (dto.condicionPago !== undefined) data.condicionPago = dto.condicionPago;
      if (dto.emiteFactura !== undefined) data.emiteFactura = dto.emiteFactura;
      if (dto.calificacion !== undefined) data.calificacion = dto.calificacion;
      if (dto.observaciones !== undefined) data.observaciones = dto.observaciones.trim() || null;
      if (dto.activo !== undefined) data.activo = dto.activo;

      const proveedor = await tx.proveedor.update({ where: { id }, data });
      await this.bitacora.registrar(
        {
          entidad: 'Proveedor',
          entidadId: id,
          accion: 'EDITAR',
          usuarioId: autorId,
          detalle: {
            antes: { razonSocial: anterior.razonSocial, activo: anterior.activo },
            despues: dto as unknown as Prisma.InputJsonValue,
          },
        },
        tx,
      );
      return proveedor;
    });
  }

  // ------------------------------------------------------------------
  // Historial de precios
  // ------------------------------------------------------------------

  listarPrecios(id: string) {
    return this.prisma.proveedorInsumo.findMany({
      where: { proveedorId: id },
      orderBy: { fecha: 'desc' },
      include: { insumo: { select: { id: true, nombre: true, unidadBaseCodigo: true } } },
    });
  }

  async registrarPrecio(id: string, dto: RegistrarPrecioDto, autorId: string) {
    const [proveedor, insumo] = await Promise.all([
      this.prisma.proveedor.findUnique({ where: { id } }),
      this.prisma.insumo.findUnique({ where: { id: dto.insumoId } }),
    ]);
    if (!proveedor) throw new BadRequestException('El proveedor no existe');
    if (!insumo) throw new BadRequestException('El insumo no existe');

    return this.prisma.$transaction(async (tx) => {
      const precio = await tx.proveedorInsumo.create({
        data: {
          proveedorId: id,
          insumoId: dto.insumoId,
          precioUnitario: dto.precioUnitario,
        },
        include: {
          insumo: { select: { id: true, nombre: true, unidadBaseCodigo: true } },
        },
      });
      await this.bitacora.registrar(
        {
          entidad: 'Proveedor',
          entidadId: id,
          accion: 'EDITAR',
          usuarioId: autorId,
          detalle: {
            precioIns: { insumo: insumo.nombre, precioUnitario: dto.precioUnitario },
          },
        },
        tx,
      );
      return precio;
    });
  }

  /** Último precio registrado por cada proveedor para un insumo (para comparar). */
  async preciosPorInsumo(insumoId: string) {
    const filas = await this.prisma.proveedorInsumo.findMany({
      where: { insumoId },
      orderBy: { fecha: 'desc' },
      include: {
        proveedor: { select: { id: true, razonSocial: true, activo: true } },
      },
    });
    const ultimo = new Map<string, (typeof filas)[number]>();
    for (const fila of filas) {
      if (!ultimo.has(fila.proveedorId)) ultimo.set(fila.proveedorId, fila);
    }
    return [...ultimo.values()].sort((a, b) => Number(a.precioUnitario) - Number(b.precioUnitario));
  }
}
