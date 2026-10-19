import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { Rol } from '../../generated/prisma/enums';

export class CrearUsuarioDto {
  @IsString()
  @MinLength(3)
  nombre: string;

  @IsEmail({}, { message: 'Correo electrónico inválido' })
  email: string;

  @IsEnum(Rol, { message: `Rol inválido. Valores: ${Object.values(Rol).join(', ')}` })
  rol: Rol;

  /** Contraseña temporal; el usuario deberá cambiarla en su primer ingreso. */
  @IsString()
  @MinLength(8)
  passwordTemporal: string;

  @IsOptional()
  @IsUUID()
  personaId?: string;
}
