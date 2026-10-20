import { Module } from '@nestjs/common';
import { BitacoraModule } from '../bitacora/bitacora.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ContratosController } from './contratos.controller';
import { ContratosService } from './contratos.service';

@Module({
  imports: [PrismaModule, BitacoraModule],
  controllers: [ContratosController],
  providers: [ContratosService],
})
export class ContratosModule {}
