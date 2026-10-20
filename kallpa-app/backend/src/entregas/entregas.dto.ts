import { Type } from 'class-transformer';
import {
  ArrayNotEmpty, IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength, ValidateNested,
} from 'class-validator';
import { Conformidad } from '../generated/prisma/enums';

export class EntregaItemDto {
  @IsUUID() solicitudItemId: string;
  /** En la unidad del ítem de la solicitud. */
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) cantidadRecibida: number;
  @IsEnum(Conformidad) conformidad: Conformidad;
  @IsOptional() @IsString() @MaxLength(300) observacion?: string;
}

export class CrearEntregaDto {
  @IsUUID() solicitudId: string;
  @IsUUID() recibidoPorId: string;
  @IsString() @MinLength(2) @MaxLength(160) lugar: string;
  @IsEnum(Conformidad) conformidad: Conformidad;
  @IsOptional() @IsString() @MaxLength(1000) observaciones?: string;
  @IsArray() @ArrayNotEmpty() @ValidateNested({ each: true }) @Type(() => EntregaItemDto)
  items: EntregaItemDto[];
}
