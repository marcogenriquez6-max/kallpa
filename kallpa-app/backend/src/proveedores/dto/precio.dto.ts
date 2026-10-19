import { IsNumber, IsString, Min, MinLength } from 'class-validator';

export class RegistrarPrecioDto {
  @IsString()
  @MinLength(1)
  insumoId: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio debe tener como máximo 2 decimales' })
  @Min(0.01)
  precioUnitario: number;
}
