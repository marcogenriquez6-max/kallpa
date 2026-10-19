import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Correo electrónico inválido' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'Ingrese su contraseña' })
  password: string;
}
