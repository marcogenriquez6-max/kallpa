import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CrearCategoriaInsumoDto {
  @IsString()
  @MaxLength(120)
  nombre: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class ActualizarCategoriaInsumoDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombre?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
