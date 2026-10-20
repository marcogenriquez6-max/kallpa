import { Module } from '@nestjs/common';
import { BitacoraModule } from '../bitacora/bitacora.module';
import { PrismaModule } from '../prisma/prisma.module';
import { InsumosController } from './insumos.controller';
import { InsumosService } from './insumos.service';

@Module({
  imports: [PrismaModule, BitacoraModule],
  controllers: [InsumosController],
  providers: [InsumosService],
})
export class InsumosModule {}
