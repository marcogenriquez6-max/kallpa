import { IsString, Matches, MinLength } from 'class-validator';

export class CambiarPasswordDto {
  @IsString()
  passwordActual: string;

  @IsString()
  @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'La nueva contraseña debe combinar letras y números',
  })
  passwordNueva: string;
}
