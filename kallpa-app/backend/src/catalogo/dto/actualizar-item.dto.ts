import { PartialType } from '@nestjs/mapped-types';
import { CrearItemCatalogoDto } from './crear-item.dto';

export class ActualizarItemCatalogoDto extends PartialType(CrearItemCatalogoDto) {}
