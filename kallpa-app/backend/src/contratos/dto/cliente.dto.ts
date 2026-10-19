import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TipoCliente } from '../../generated/prisma/enums';

export class CrearClienteDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  ci?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  nit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  razonSocial?: string;

  @IsString()
  @MinLength(5)
  @MaxLength(30)
  telefono: string;

  @IsOptional()
  @IsEmail({}, { message: 'Correo electrónico inválido' })
  email?: string;

  @IsEnum(TipoCliente, {
    message: `Tipo de cliente inválido. Valores: ${Object.values(TipoCliente).join(', ')}`,
  })
  tipo: TipoCliente;
}

export class ActualizarClienteDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  ci?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  nit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  razonSocial?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(30)
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Correo electrónico inválido' })
  email?: string;

  @IsOptional()
  @IsEnum(TipoCliente)
  tipo?: TipoCliente;
}
