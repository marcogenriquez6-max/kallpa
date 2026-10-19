import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CondicionPago } from '../../generated/prisma/enums';

export class CrearProveedorDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  razonSocial: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombreContacto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  nitOCi?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsapp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  direccion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  ubicacionMercado?: string;

  @IsOptional()
  @IsEnum(CondicionPago, {
    message: `Condición de pago inválida. Valores: ${Object.values(CondicionPago).join(', ')}`,
  })
  condicionPago?: CondicionPago;

  @IsOptional()
  @IsBoolean()
  emiteFactura?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  calificacion?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class ActualizarProveedorDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  razonSocial?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombreContacto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  nitOCi?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsapp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  direccion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  ubicacionMercado?: string;

  @IsOptional()
  @IsEnum(CondicionPago)
  condicionPago?: CondicionPago;

  @IsOptional()
  @IsBoolean()
  emiteFactura?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  calificacion?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
