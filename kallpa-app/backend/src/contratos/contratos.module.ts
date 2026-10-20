import { Module } from '@nestjs/common';
import { ParametrosModule } from '../parametros/parametros.module';
import { ClientesController } from './clientes.controller';
import { ClientesService } from './clientes.service';
import { ContratosController } from './contratos.controller';
import { ContratosService } from './contratos.service';

/**
 * Clientes y contratos de eventos: menú contratado, pagos y ciclo de vida
 * (cotización → confirmado → planificado → … → liquidado).
 */
@Module({
  imports: [ParametrosModule],
  controllers: [ClientesController, ContratosController],
  providers: [ClientesService, ContratosService],
})
export class ContratosModule {}
