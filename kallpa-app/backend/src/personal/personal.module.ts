import {
  BadRequestException, Body, Controller, Get, Injectable, Module, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import {
  IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength,
} from 'class-validator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { BitacoraService } from '../bitacora/bitacora.service';
import { redondear } from '../common/flujo';
import { UsuarioSesion } from '../common/usuario-sesion';
import { ModalidadPago, Rol, TipoPersona } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

export class PersonaDto {
  @IsString() @MinLength(2) @MaxLength(120) nombre: string;
  @IsString() @MinLength(4) @MaxLength(20) ci: string;
  @IsOptional() @IsString() @MaxLength(30) telefono?: string;
  @IsEnum(TipoPersona) tipo: TipoPersona;
  @IsOptional() @IsDateString() carnetSanitarioVence?: string;
}

export class ActualizarPersonaDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) nombre?: string;
  @IsOptional() @IsString() @MaxLength(30) telefono?: string;
  @IsOptional() @IsEnum(TipoPersona) tipo?: TipoPersona;
  @IsOptional() @IsDateString() carnetSanitarioVence?: string;
  @IsOptional() @IsBoolean() activo?: boolean;
}

export class RemuneracionDto {
  @IsUUID() contratoId: string;
  @IsUUID() personaId: string;
  @IsString() @MinLength(2) @MaxLength(80) concepto: string;
  @IsEnum(ModalidadPago) modalidad: ModalidadPago;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) cantidad: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) tarifa: number;
}

@Injectable()
export class PersonalService {
  constructor(private readonly prisma: PrismaService, private readonly bitacora: BitacoraService) {}

  personas() {
    return this.prisma.persona.findMany({
      orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
      include: { _count: { select: { remuneraciones: true } } },
    });
  }

  async crearPersona(dto: PersonaDto, autorId: string) {
    if (await this.prisma.persona.findUnique({ where: { ci: dto.ci.trim() } })) {
      throw new BadRequestException(`Ya existe una persona con CI ${dto.ci}`);
    }
    const p = await this.prisma.persona.create({
      data: {
        nombre: dto.nombre.trim(), ci: dto.ci.trim(), telefono: dto.telefono?.trim() || null, tipo: dto.tipo,
        carnetSanitarioVence: dto.carnetSanitarioVence ? new Date(dto.carnetSanitarioVence) : null,
      },
    });
    await this.bitacora.registrar({ entidad: 'Persona', entidadId: p.id, accion: 'CREAR', usuarioId: autorId, detalle: { nombre: p.nombre } });
    return p;
  }

  async actualizarPersona(id: string, dto: ActualizarPersonaDto, autorId: string) {
    const p = await this.prisma.persona.update({
      where: { id },
      data: {
        nombre: dto.nombre?.trim(), telefono: dto.telefono === undefined ? undefined : dto.telefono.trim() || null,
        tipo: dto.tipo, activo: dto.activo,
        carnetSanitarioVence: dto.carnetSanitarioVence ? new Date(dto.carnetSanitarioVence) : undefined,
      },
    });
    await this.bitacora.registrar({ entidad: 'Persona', entidadId: id, accion: 'EDITAR', usuarioId: autorId, detalle: { ...dto } });
    return p;
  }

  remuneraciones(filtro: { contratoId?: string; personaId?: string; pagado?: boolean }) {
    return this.prisma.remuneracionEvento.findMany({
      where: filtro,
      orderBy: { id: 'desc' },
      take: 500,
      include: {
        persona: { select: { nombre: true, tipo: true } },
        contrato: { select: { codigo: true, tipoEvento: true, fechaEvento: true } },
      },
    });
  }

  async crearRemuneracion(dto: RemuneracionDto, autorId: string) {
    const r = await this.prisma.remuneracionEvento.create({
      data: { ...dto, concepto: dto.concepto.trim(), monto: redondear(dto.cantidad * dto.tarifa) },
    });
    await this.bitacora.registrar({
      entidad: 'RemuneracionEvento', entidadId: r.id, accion: 'CREAR', usuarioId: autorId,
      detalle: { concepto: r.concepto, monto: r.monto.toString() },
    });
    return r;
  }

  async pagar(id: string, autorId: string) {
    const r = await this.prisma.remuneracionEvento.update({ where: { id }, data: { pagado: true, fechaPago: new Date() } });
    await this.bitacora.registrar({ entidad: 'RemuneracionEvento', entidadId: id, accion: 'CAMBIAR_ESTADO', usuarioId: autorId, estadoNuevo: 'PAGADO' });
    return r;
  }
}

@Controller('personal')
@Roles(Rol.GERENTE, Rol.CONSULTA)
export class PersonalController {
  constructor(private readonly personal: PersonalService) {}

  @Get('personas') personas() { return this.personal.personas(); }

  @Post('personas') @Roles(Rol.GERENTE)
  crearPersona(@Body() dto: PersonaDto, @UsuarioActual() u: UsuarioSesion) { return this.personal.crearPersona(dto, u.id); }

  @Patch('personas/:id') @Roles(Rol.GERENTE)
  actualizarPersona(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarPersonaDto, @UsuarioActual() u: UsuarioSesion) {
    return this.personal.actualizarPersona(id, dto, u.id);
  }

  @Get('remuneraciones')
  remuneraciones(@Query('contratoId') contratoId?: string, @Query('personaId') personaId?: string, @Query('pagado') pagado?: string) {
    return this.personal.remuneraciones({
      contratoId: contratoId || undefined, personaId: personaId || undefined,
      pagado: pagado === undefined || pagado === '' ? undefined : pagado === 'true',
    });
  }

  @Post('remuneraciones') @Roles(Rol.GERENTE)
  crearRemuneracion(@Body() dto: RemuneracionDto, @UsuarioActual() u: UsuarioSesion) { return this.personal.crearRemuneracion(dto, u.id); }

  @Post('remuneraciones/:id/pagar') @Roles(Rol.GERENTE)
  pagar(@Param('id', ParseUUIDPipe) id: string, @UsuarioActual() u: UsuarioSesion) { return this.personal.pagar(id, u.id); }
}

@Module({ controllers: [PersonalController], providers: [PersonalService] })
export class PersonalModule {}
