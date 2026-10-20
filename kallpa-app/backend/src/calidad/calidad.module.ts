import { Body, Controller, Get, Injectable, Module, Post, Query } from '@nestjs/common';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { BitacoraService } from '../bitacora/bitacora.service';
import { UsuarioSesion } from '../common/usuario-sesion';
import { PuntoControl, Rol } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Rangos seguros (°C) por punto de control, según buenas prácticas de inocuidad:
 * frío ≤ 5 °C, cocción ≥ 74 °C, caliente en traslado/servicio ≥ 60 °C (o frío ≤ 5 °C).
 */
export function fueraDeRango(punto: PuntoControl, t: number): boolean {
  switch (punto) {
    case 'RECEPCION':
    case 'ALMACENAMIENTO':
    case 'ENFRIAMIENTO':
      return t > 5;
    case 'COCCION':
      return t < 74;
    default:
      return t > 5 && t < 60;
  }
}

export class CrearTemperaturaDto {
  @IsUUID() contratoId: string;
  @IsEnum(PuntoControl) punto: PuntoControl;
  @IsString() @MinLength(2) @MaxLength(120) alimento: string;
  @IsNumber({ maxDecimalPlaces: 1 }) @Min(-40) @Max(250) temperaturaC: number;
  @IsOptional() @IsString() @MaxLength(500) accionCorrectiva?: string;
}

@Injectable()
export class CalidadService {
  constructor(private readonly prisma: PrismaService, private readonly bitacora: BitacoraService) {}

  listar(filtro: { contratoId?: string; soloFuera?: boolean }) {
    return this.prisma.controlTemperatura.findMany({
      where: { contratoId: filtro.contratoId, fueraDeRango: filtro.soloFuera ? true : undefined },
      orderBy: { fechaHora: 'desc' },
      take: 500,
      include: {
        responsable: { select: { nombre: true } },
        contrato: { select: { codigo: true, tipoEvento: true } },
      },
    });
  }

  async crear(dto: CrearTemperaturaDto, autorId: string) {
    const fuera = fueraDeRango(dto.punto, dto.temperaturaC);
    return this.prisma.$transaction(async (tx) => {
      await tx.contrato.findUniqueOrThrow({ where: { id: dto.contratoId } });
      const r = await tx.controlTemperatura.create({
        data: {
          contratoId: dto.contratoId,
          punto: dto.punto,
          alimento: dto.alimento.trim(),
          temperaturaC: dto.temperaturaC,
          fueraDeRango: fuera,
          accionCorrectiva: dto.accionCorrectiva?.trim() || null,
          responsableId: autorId,
        },
      });
      await this.bitacora.registrar({
        entidad: 'ControlTemperatura', entidadId: r.id, accion: 'CREAR', usuarioId: autorId,
        detalle: { punto: dto.punto, alimento: dto.alimento, temperaturaC: dto.temperaturaC, fueraDeRango: fuera },
      }, tx);
      return r;
    });
  }
}

@Controller('calidad')
export class CalidadController {
  constructor(private readonly calidad: CalidadService) {}

  @Get('temperaturas')
  listar(@Query('contratoId') contratoId?: string, @Query('soloFuera') soloFuera?: string) {
    return this.calidad.listar({ contratoId: contratoId || undefined, soloFuera: soloFuera === 'true' });
  }

  @Post('temperaturas')
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO, Rol.COCINA, Rol.LOGISTICA)
  crear(@Body() dto: CrearTemperaturaDto, @UsuarioActual() u: UsuarioSesion) {
    return this.calidad.crear(dto, u.id);
  }
}

@Module({ controllers: [CalidadController], providers: [CalidadService] })
export class CalidadModule {}
