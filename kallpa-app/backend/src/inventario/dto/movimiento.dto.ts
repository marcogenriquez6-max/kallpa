import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { MotivoMovimiento, TipoMovimiento } from '../../generated/prisma/enums';

/**
 * Registro de un movimiento de almacén. `cantidad` es el cambio con signo en la
 * unidad base del insumo: positiva en una entrada, negativa en una salida y de
 * cualquier signo en un ajuste por conteo físico.
 */
export class CrearMovimientoDto {
  @IsUUID()
  insumoId: string;

  @IsEnum(TipoMovimiento)
  tipo: TipoMovimiento;

  @IsEnum(MotivoMovimiento)
  motivo: MotivoMovimiento;

  @IsNumber({ maxDecimalPlaces: 3 })
  cantidad: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  costoUnitario?: number;

  @IsOptional()
  @IsUUID()
  contratoId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  referenciaTipo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  referenciaId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  observacion?: string;
}
