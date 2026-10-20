import { Module } from '@nestjs/common';
import { BitacoraModule } from '../bitacora/bitacora.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ComprasController } from './compras.controller';
import { ComprasService } from './compras.service';

@Module({
  imports: [PrismaModule, BitacoraModule],
  controllers: [ComprasController],
  providers: [ComprasService],
})
export class ComprasModule {}
