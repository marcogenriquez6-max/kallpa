import { IsEnum, IsNumber, IsOptional, IsString, Length, MaxLength, Min, MinLength } from 'class-validator';
import { TipoUnidad } from '../../generated/prisma/enums';

export class CrearUnidadDto {
  @IsString()
  @Length(1, 12)
  codigo: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  nombre: string;

  @IsEnum(TipoUnidad, {
    message: `Tipo inválido. Valores: ${Object.values(TipoUnidad).join(', ')}`,
  })
  tipo: TipoUnidad;

  /** Cuántas unidades base equivale una unidad de este tipo (KG=1000 g). */
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  factorBase: number;
}

export class ActualizarUnidadDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  nombre?: string;

  @IsOptional()
  @IsEnum(TipoUnidad)
  tipo?: TipoUnidad;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  factorBase?: number;
}
