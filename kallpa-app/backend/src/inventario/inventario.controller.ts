import { Controller, Get, Query } from '@nestjs/common';
import { InventarioService } from './inventario.service';

@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventario: InventarioService) {}

  @Get('resumen')
  resumen() {
    return this.inventario.resumen();
  }

  @Get('existencias')
  existencias() {
    return this.inventario.existencias();
  }

  @Get('movimientos')
  movimientos(@Query('insumoId') insumoId?: string) {
    return this.inventario.movimientos({ insumoId });
  }
}
