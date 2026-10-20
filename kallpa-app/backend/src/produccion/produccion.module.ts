import { Body, Controller, Get, Injectable, Module, Post, Query } from '@nestjs/common';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { BitacoraService } from '../bitacora/bitacora.service';
import { avanzarContrato } from '../common/flujo';
import { UsuarioSesion } from '../common/usuario-sesion';
import { EstadoContrato, EtapaProduccion, Rol } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

export class CrearRegistroProduccionDto {
  @IsUUID() contratoId: string;
  @IsEnum(EtapaProduccion) etapa: EtapaProduccion;
  @IsOptional() @IsString() @MaxLength(500) observacion?: string;
}

@Injectable()
export class ProduccionService {
  constructor(private readonly prisma: PrismaService, private readonly bitacora: BitacoraService) {}

  listar(contratoId?: string) {
    return this.prisma.registroProduccion.findMany({
      where: { contratoId },
      orderBy: { fechaHora: 'asc' },
      take: 500,
      include: {
        responsable: { select: { nombre: true } },
        contrato: { select: { codigo: true, tipoEvento: true } },
      },
    });
  }

  /** La primera etapa pone el contrato EN_PRODUCCION; la etapa SERVICIO lo deja SERVIDO. */
  crear(dto: CrearRegistroProduccionDto, autorId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.contrato.findUniqueOrThrow({ where: { id: dto.contratoId } });
      const registro = await tx.registroProduccion.create({
        data: {
          contratoId: dto.contratoId,
          etapa: dto.etapa,
          responsableId: autorId,
          observacion: dto.observacion?.trim() || null,
        },
      });
      await avanzarContrato(tx, this.bitacora, dto.contratoId,
        [EstadoContrato.INSUMOS_ENTREGADOS], EstadoContrato.EN_PRODUCCION, autorId, 'Inicio de producción');
      if (dto.etapa === EtapaProduccion.SERVICIO) {
        await avanzarContrato(tx, this.bitacora, dto.contratoId,
          [EstadoContrato.EN_PRODUCCION], EstadoContrato.SERVIDO, autorId, 'Servicio realizado');
      }
      await this.bitacora.registrar({
        entidad: 'RegistroProduccion', entidadId: registro.id, accion: 'CREAR', usuarioId: autorId,
        detalle: { contratoId: dto.contratoId, etapa: dto.etapa },
      }, tx);
      return registro;
    });
  }
}

@Controller('produccion')
export class ProduccionController {
  constructor(private readonly produccion: ProduccionService) {}

  @Get()
  listar(@Query('contratoId') contratoId?: string) {
    return this.produccion.listar(contratoId || undefined);
  }

  @Post()
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO, Rol.COCINA)
  crear(@Body() dto: CrearRegistroProduccionDto, @UsuarioActual() u: UsuarioSesion) {
    return this.produccion.crear(dto, u.id);
  }
}

@Module({ controllers: [ProduccionController], providers: [ProduccionService] })
export class ProduccionModule {}
