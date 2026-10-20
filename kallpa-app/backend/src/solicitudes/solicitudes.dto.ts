import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';
import { EstadoSolicitud, OrigenInsumo } from '../generated/prisma/enums';

export class SolicitudItemDto {
  @IsUUID()
  insumoId: string;

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  cantidadSolicitada: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  observacion?: string;
}

export class CrearSolicitudDto {
  @IsOptional()
  @IsUUID()
  contratoId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  solicitante?: string;

  @IsOptional()
  @IsDateString()
  fechaNecesaria?: string;

  @IsOptional()
  @IsEnum(OrigenInsumo)
  origen?: OrigenInsumo;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  motivo?: string;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SolicitudItemDto)
  items: SolicitudItemDto[];
}

export class ActualizarSolicitudDto {
  @IsOptional()
  @IsEnum(EstadoSolicitud)
  estado?: EstadoSolicitud;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  aprobadoPor?: string;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SolicitudItemDto)
  items?: SolicitudItemDto[];
}
