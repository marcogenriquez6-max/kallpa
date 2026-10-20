import { Module } from '@nestjs/common';
import { BitacoraModule } from '../bitacora/bitacora.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UnidadesController } from './unidades.controller';
import { UnidadesService } from './unidades.service';

@Module({
  imports: [PrismaModule, BitacoraModule],
  controllers: [UnidadesController],
  providers: [UnidadesService],
})
export class UnidadesModule {}
