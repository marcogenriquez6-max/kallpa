import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BitacoraService } from '../bitacora/bitacora.service';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarUnidadDto, CrearUnidadDto } from './dto/unidad.dto';

@Injectable()
export class UnidadesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  listar() {
    return this.prisma.unidadMedida.findMany({ orderBy: [{ tipo: 'asc' }, { codigo: 'asc' }] });
  }

  async crear(dto: CrearUnidadDto, autorId: string) {
    const codigo = dto.codigo.toUpperCase().trim();
    if (await this.prisma.unidadMedida.findUnique({ where: { codigo } })) {
      throw new ConflictException(`Ya existe la unidad ${codigo}`);
    }
    return this.prisma.$transaction(async (tx) => {
      const unidad = await tx.unidadMedida.create({
        data: {
          codigo,
          nombre: dto.nombre.trim(),
          tipo: dto.tipo,
          factorBase: dto.factorBase,
        },
      });
      await this.bitacora.registrar(
        {
          entidad: 'UnidadMedida',
          entidadId: codigo,
          accion: 'CREAR',
          usuarioId: autorId,
          detalle: {
            codigo,
            nombre: unidad.nombre,
            tipo: unidad.tipo,
            factorBase: unidad.factorBase.toString(),
          },
        },
        tx,
      );
      return unidad;
    });
  }

  async actualizar(codigo: string, dto: ActualizarUnidadDto, autorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const anterior = await tx.unidadMedida.findUnique({ where: { codigo } });
      if (!anterior) throw new NotFoundException(`No existe la unidad ${codigo}`);

      const unidad = await tx.unidadMedida.update({
        where: { codigo },
        data: {
          nombre: dto.nombre?.trim(),
          tipo: dto.tipo,
          factorBase: dto.factorBase,
        },
      });
      await this.bitacora.registrar(
        {
          entidad: 'UnidadMedida',
          entidadId: codigo,
          accion: 'EDITAR',
          usuarioId: autorId,
          detalle: {
            antes: {
              nombre: anterior.nombre,
              tipo: anterior.tipo,
              factorBase: anterior.factorBase.toString(),
            },
            despues: dto as unknown as Prisma.InputJsonValue,
          },
        },
        tx,
      );
      return unidad;
    });
  }
}
