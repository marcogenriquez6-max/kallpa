import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TipoUnidad } from '../generated/prisma/enums';

export class CrearUnidadDto {
  @IsString()
  @MaxLength(10)
  codigo: string;

  @IsString()
  @MaxLength(80)
  nombre: string;

  @IsEnum(TipoUnidad)
  tipo: TipoUnidad;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class ActualizarUnidadDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nombre?: string;

  @IsOptional()
  @IsEnum(TipoUnidad)
  tipo?: TipoUnidad;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
