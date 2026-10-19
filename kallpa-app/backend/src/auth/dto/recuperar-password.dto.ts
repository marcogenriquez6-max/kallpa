import { IsEmail } from 'class-validator';

export class RecuperarPasswordDto {
  @IsEmail({}, { message: 'Correo electrónico inválido' })
  email: string;
}
