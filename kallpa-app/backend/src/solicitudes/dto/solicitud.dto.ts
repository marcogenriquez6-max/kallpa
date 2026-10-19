import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { OrigenInsumo } from '../../generated/prisma/enums';

export class CrearSolicitudDto {
  @IsString()
  @MinLength(1)
  contratoId: string;

  /** Cuándo debe estar el insumo en cocina. Si falta, se usa la fecha del evento. */
  @IsOptional()
  @IsDateString({}, { message: 'Fecha requerida inválida' })
  fechaHoraRequerida?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;
}

export class ActualizarItemSolicitudDto {
  /** Cantidad definida por el chef; nula si el insumo es A_CRITERIO. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  cantidad?: number;

  @IsOptional()
  @IsEnum(OrigenInsumo)
  origen?: OrigenInsumo;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  especificacion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  marca?: string;

  @IsOptional()
  @IsBoolean()
  marcaObligatoria?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  observacion?: string;
}

export class AgregarItemSolicitudDto extends ActualizarItemSolicitudDto {
  @IsString()
  @MinLength(1)
  insumoId: string;

  @IsOptional()
  @IsString()
  unidadCodigo?: string;
}

export class AnularSolicitudDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  motivo?: string;
}
