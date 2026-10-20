import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
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

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  factorBase: number;

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
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  factorBase?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
