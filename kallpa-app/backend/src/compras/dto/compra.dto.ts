import { IsString, IsUUID } from 'class-validator';

export class CrearCompraDto {
  @IsUUID('4', { message: 'El ID del proveedor debe ser un UUID válido' })
  proveedorId: string;

  @IsString()
  observacion?: string;
}

export class ActualizarCompraDto {
  @IsString()
  observacion?: string;

  @IsString()
  estado?: string;
}