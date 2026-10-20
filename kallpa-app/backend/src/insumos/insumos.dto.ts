import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CrearInsumoDto {
  @IsString()
  @MaxLength(160)
  nombre: string;

  @IsString()
  @IsUUID()
  categoriaId: string;

  @IsString()
  @MaxLength(10)
  unidadCompra: string;

  @IsString()
  @MaxLength(10)
  unidadConsumo: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  factorConversion?: number;

  @IsOptional()
  @IsBoolean()
  perecedero?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  marca?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  stockMinimo?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  stockMaximo?: number;
}

export class ActualizarInsumoDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  nombre?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  categoriaId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  unidadCompra?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  unidadConsumo?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  factorConversion?: number;

  @IsOptional()
  @IsBoolean()
  perecedero?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  marca?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  stockMinimo?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  stockMaximo?: number;
}
