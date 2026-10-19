import { Module } from '@nestjs/common';
import { SolicitudesController } from './solicitudes.controller';
import { SolicitudesService } from './solicitudes.service';

/**
 * Solicitud de insumos: explosión de insumos desde las fichas técnicas del menú
 * contratado, revisión y aprobación por el área gastronómica.
 */
@Module({
  controllers: [SolicitudesController],
  providers: [SolicitudesService],
})
export class SolicitudesModule {}
