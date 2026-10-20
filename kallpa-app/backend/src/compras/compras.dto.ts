import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';
import { TipoComprobante } from '../generated/prisma/enums';

export class CompraItemDto {
  @IsUUID()
  insumoId: string;

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  cantidad: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precioUnitario: number;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  lote?: string;

  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;
}

export class CrearCompraDto {
  @IsUUID()
  proveedorId: string;

  @IsOptional()
  @IsUUID()
  solicitudId?: string;

  @IsEnum(TipoComprobante)
  tipoComprobante: TipoComprobante;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  nroComprobante?: string;

  @IsOptional()
  @IsDateString()
  fechaEmision?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  descuento?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  otrosCargos?: number;

  @IsOptional()
  @IsString()
  moneda?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompraItemDto)
  items: CompraItemDto[];
}
