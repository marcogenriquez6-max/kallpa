import { Module } from '@nestjs/common';
import { InventarioController } from './inventario.controller';
import { InventarioService } from './inventario.service';

/**
 * Inventario: existencias por insumo con alerta de stock mínimo y kardex de
 * movimientos (entradas, salidas, mermas y ajustes) del almacén.
 */
@Module({
  controllers: [InventarioController],
  providers: [InventarioService],
})
export class InventarioModule {}
