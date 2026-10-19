import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CrearCategoriaDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  nombre: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;
}

export class ActualizarCategoriaDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  nombre?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;
}
