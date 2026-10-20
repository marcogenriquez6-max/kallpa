import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { LineaCatalogo, TipoItemCatalogo } from '../../generated/prisma/enums';

export class CrearItemCatalogoDto {
  @IsString()
  @MaxLength(160)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsEnum(TipoItemCatalogo)
  tipo: TipoItemCatalogo;

  @IsEnum(LineaCatalogo)
  linea: LineaCatalogo;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precioBase?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsString()
  fotoUrl?: string;
}
