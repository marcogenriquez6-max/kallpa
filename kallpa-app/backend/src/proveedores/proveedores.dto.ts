import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CrearProveedorDto {
  @IsString()
  @MaxLength(160)
  razonSocial: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  nit?: string;

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
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class ActualizarProveedorDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  razonSocial?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  nit?: string;

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
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class AgregarProveedorInsumoDto {
  @IsString()
  @MaxLength(160)
  insumoId: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  codigoProveedor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  unidadCompra?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  moneda?: string;

  @IsOptional()
  @IsBoolean()
  preferido?: boolean;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
