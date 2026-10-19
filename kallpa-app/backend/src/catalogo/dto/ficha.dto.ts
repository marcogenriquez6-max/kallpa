import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class LineaFichaDto {
  @IsString()
  insumoId: string;

  /** Cantidad neta por porción, en la unidad indicada. */
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  cantidadPorPorcion: number;

  @IsString()
  unidadCodigo: string;

  /** Merma esperada de este insumo en el plato (%). */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  porcentajeMerma?: number;

  /** Equivalente a «C/N»: la cantidad la define el cocinero. */
  @IsOptional()
  @IsBoolean()
  aCriterio?: boolean;

  @IsOptional()
  @IsString()
  especificacion?: string;
}

export class CrearFichaDto {
  /** Peso de la porción servida en gramos (opcional, informativo). */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  porcionGramos?: number;

  @IsOptional()
  @IsString()
  procedimiento?: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'La ficha debe tener al menos un insumo' })
  @ValidateNested({ each: true })
  @Type(() => LineaFichaDto)
  lineas: LineaFichaDto[];
}
