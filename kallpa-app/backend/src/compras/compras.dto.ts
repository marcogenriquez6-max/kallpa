import { Type } from 'class-transformer';
import {
  ArrayNotEmpty, IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested,
} from 'class-validator';
import { TipoComprobante } from '../generated/prisma/enums';

export class CompraItemDto {
  @IsUUID() solicitudItemId: string;
  /** Cantidad comprada, en la unidad del ítem de la solicitud. */
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001) cantidad: number;
  /** Precio por esa misma unidad, en Bs. */
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) precioUnitario: number;
  @IsOptional() @IsString() @MaxLength(80) marcaComprada?: string;
  @IsOptional() @IsString() @MaxLength(300) justificacion?: string;
}

export class CrearCompraDto {
  @IsUUID() solicitudId: string;
  @IsUUID() proveedorId: string;
  @IsOptional() @IsEnum(TipoComprobante) tipoComprobante?: TipoComprobante;
  @IsOptional() @IsString() @MaxLength(300) comprobanteUrl?: string;
  @IsArray() @ArrayNotEmpty({ message: 'La compra debe tener al menos un insumo' })
  @ValidateNested({ each: true }) @Type(() => CompraItemDto)
  items: CompraItemDto[];
}
