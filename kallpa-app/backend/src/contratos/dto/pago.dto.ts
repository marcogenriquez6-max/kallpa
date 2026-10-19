import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { TipoPago } from '../../generated/prisma/enums';

export class CrearPagoDto {
  @IsEnum(TipoPago, {
    message: `Tipo de pago inválido. Valores: ${Object.values(TipoPago).join(', ')}`,
  })
  tipo: TipoPago;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monto: number;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  metodo: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  comprobante?: string;
}
