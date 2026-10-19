import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { LineaCatalogo, TipoItemCatalogo } from '../../generated/prisma/enums';

export class CrearItemCatalogoDto {
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  codigo: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  descripcion?: string;

  @IsEnum(TipoItemCatalogo, {
    message: `Tipo inválido. Valores: ${Object.values(TipoItemCatalogo).join(', ')}`,
  })
  tipo: TipoItemCatalogo;

  @IsOptional()
  @IsEnum(LineaCatalogo, {
    message: `Línea inválida. Valores: ${Object.values(LineaCatalogo).join(', ')}`,
  })
  linea?: LineaCatalogo;

  /** Precio de venta por persona/plato, en bolivianos. */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precioVenta: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class ActualizarItemCatalogoDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  codigo?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  descripcion?: string;

  @IsOptional()
  @IsEnum(TipoItemCatalogo)
  tipo?: TipoItemCatalogo;

  @IsOptional()
  @IsEnum(LineaCatalogo)
  linea?: LineaCatalogo;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precioVenta?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
