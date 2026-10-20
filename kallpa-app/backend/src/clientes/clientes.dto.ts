import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TipoCliente } from '../generated/prisma/enums';

export class CrearClienteDto {
  @IsString()
  @MaxLength(160)
  razonSocial: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  nitCi?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  telefono?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  correo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  contacto?: string;

  @IsEnum(TipoCliente)
  tipo: TipoCliente;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class ActualizarClienteDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  razonSocial?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  nitCi?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  telefono?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  correo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  contacto?: string;

  @IsOptional()
  @IsEnum(TipoCliente)
  tipo?: TipoCliente;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
