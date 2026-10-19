import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { EstadoContrato } from '../../generated/prisma/enums';

export class CambiarEstadoDto {
  @IsEnum(EstadoContrato, {
    message: `Estado inválido. Valores: ${Object.values(EstadoContrato).join(', ')}`,
  })
  estado: EstadoContrato;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  motivo?: string;
}

export class ConfirmarPlatosDto {
  @IsInt()
  @Min(1)
  numeroPlatosFinal: number;
}
