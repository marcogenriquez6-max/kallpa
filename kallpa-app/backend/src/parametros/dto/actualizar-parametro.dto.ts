import { IsNumber } from 'class-validator';

export class ActualizarParametroDto {
  @IsNumber({}, { message: 'El valor debe ser numérico' })
  valor: number;
}
