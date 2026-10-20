import { Injectable, ConflictException } from '@nestjs/common';
import { BitacoraService } from '../bitacora/bitacora.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarUnidadDto, CrearUnidadDto } from './unidades.dto';

@Injectable()
export class UnidadesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  listar() {
    return this.prisma.unidadMedida.findMany({ orderBy: { codigo: 'asc' } });
  }

  async crear(dto: CrearUnidadDto, autorId: string) {
    const codigo = dto.codigo.toUpperCase().trim();
    if (await this.prisma.unidadMedida.findUnique({ where: { codigo } })) {
      throw new ConflictException('Ya existe una unidad con ese código');
    }
    return this.prisma.$transaction(async (tx) => {
      const unidad = await tx.unidadMedida.create({ data: { ...dto, codigo } });
      await this.bitacora.registrar(
        { entidad: 'UnidadMedida', entidadId: unidad.codigo, accion: 'CREAR', usuarioId: autorId, detalle: { nombre: unidad.nombre, tipo: unidad.tipo } },
        tx,
      );
      return unidad;
    });
  }

  async actualizar(codigo: string, dto: ActualizarUnidadDto, autorId: string) {
    const actual = await this.prisma.unidadMedida.findUniqueOrThrow({ where: { codigo } });
    return this.prisma.$transaction(async (tx) => {
      const unidad = await tx.unidadMedida.update({ where: { codigo }, data: dto as any });
      await this.bitacora.registrar(
        {
          entidad: 'UnidadMedida',
          entidadId: codigo,
          accion: 'EDITAR',
          usuarioId: autorId,
          detalle: { antes: { nombre: actual.nombre, tipo: actual.tipo, factorBase: actual.factorBase?.toString?.() }, despues: dto },
        },
        tx,
      );
      return unidad;
    });
  }
}
