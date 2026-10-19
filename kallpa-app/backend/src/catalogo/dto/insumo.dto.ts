import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CrearInsumoDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nombre: string;

  @IsInt()
  categoriaId: number;

  @IsString()
  unidadBaseCodigo: string;

  @IsOptional()
  @IsString()
  unidadCompraCodigo?: string;

  /** Peso medio en gramos para insumos contados por unidad (pechuga, huevo). */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  pesoUnitarioGramos?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  especificacionHabitual?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  marcaPreferida?: string;

  @IsOptional()
  @IsBoolean()
  perecible?: boolean;

  @IsOptional()
  @IsBoolean()
  requiereFrio?: boolean;

  /** Existencias mínimas en unidad base; dispara la alerta de reposición. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  stockMinimo?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class ActualizarInsumoDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nombre?: string;

  @IsOptional()
  @IsInt()
  categoriaId?: number;

  @IsOptional()
  @IsString()
  unidadBaseCodigo?: string;

  @IsOptional()
  @IsString()
  unidadCompraCodigo?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  pesoUnitarioGramos?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  especificacionHabitual?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  marcaPreferida?: string;

  @IsOptional()
  @IsBoolean()
  perecible?: boolean;

  @IsOptional()
  @IsBoolean()
  requiereFrio?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  stockMinimo?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
