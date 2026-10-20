import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';
import { EstadoContrato } from '../generated/prisma/enums';

export class ContratoItemDto {
  @IsUUID()
  itemCatalogoId: string;

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(1)
  cantidad: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precioUnitario: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  observacion?: string;
}

export class CrearContratoDto {
  @IsUUID()
  clienteId: string;

  @IsString()
  @MaxLength(40)
  codigo: string;

  @IsDateString()
  fechaEvento: string;

  @IsOptional()
  @IsDateString()
  horaInicio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  lugar?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  invitados?: number;

  @IsOptional()
  @IsEnum(EstadoContrato)
  estado?: EstadoContrato;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montoGarantia?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  descuento?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContratoItemDto)
  items: ContratoItemDto[];
}

export class ActualizarContratoDto {
  @IsOptional()
  @IsDateString()
  fechaEvento?: string;

  @IsOptional()
  @IsDateString()
  horaInicio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  lugar?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  invitados?: number;

  @IsOptional()
  @IsEnum(EstadoContrato)
  estado?: EstadoContrato;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montoGarantia?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  descuento?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContratoItemDto)
  items?: ContratoItemDto[];
}
