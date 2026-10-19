import { Module } from '@nestjs/common';
import { ProveedoresController } from './proveedores.controller';
import { ProveedoresService } from './proveedores.service';

/**
 * Proveedores e historial de precios por insumo, que alimenta el costeo
 * teórico de las fichas técnicas y las compras.
 */
@Module({
  controllers: [ProveedoresController],
  providers: [ProveedoresService],
})
export class ProveedoresModule {}
