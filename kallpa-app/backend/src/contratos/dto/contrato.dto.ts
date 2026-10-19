import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ContratoItemDto {
  @IsString()
  @MinLength(1)
  itemId: string;

  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1)
  cantidad: number;
}

export class CrearContratoDto {
  @IsString()
  @MinLength(1)
  clienteId: string;

  @IsString()
  @MinLength(3)
  @MaxLength(80)
  tipoEvento: string;

  @IsDateString({}, { message: 'Fecha del evento inválida' })
  fechaEvento: string;

  @IsString()
  @MinLength(4)
  @MaxLength(5)
  horaServicio: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  lugar: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  direccion?: string;

  @IsInt()
  @Min(1)
  numeroPlatos: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  requisitosEspeciales?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'El contrato debe incluir al menos un ítem del menú' })
  @ValidateNested({ each: true })
  @Type(() => ContratoItemDto)
  items: ContratoItemDto[];
}

export class ActualizarContratoDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  clienteId?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  tipoEvento?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha del evento inválida' })
  fechaEvento?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(5)
  horaServicio?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  lugar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  direccion?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  numeroPlatos?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  requisitosEspeciales?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;
}

export class ReemplazarItemsDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'El contrato debe incluir al menos un ítem del menú' })
  @ValidateNested({ each: true })
  @Type(() => ContratoItemDto)
  items: ContratoItemDto[];
}
