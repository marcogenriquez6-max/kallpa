import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';

export class FichaTecnicaLineaDto {
  @IsUUID()
  insumoId: string;

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  cantidadBruta: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  observacion?: string;
}

export class GuardarFichaTecnicaDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FichaTecnicaLineaDto)
  lineas?: FichaTecnicaLineaDto[];
}
