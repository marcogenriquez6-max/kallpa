import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Rol } from '../../generated/prisma/enums';

export class ActualizarUsuarioDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  nombre?: string;

  @IsOptional()
  @IsEnum(Rol)
  rol?: Rol;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class RestablecerPasswordDto {
  @IsString()
  @MinLength(8)
  passwordTemporal: string;
}
