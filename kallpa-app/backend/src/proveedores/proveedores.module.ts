import { Module } from '@nestjs/common';
import { BitacoraModule } from '../bitacora/bitacora.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProveedoresController } from './proveedores.controller';
import { ProveedoresService } from './proveedores.service';

@Module({
  imports: [PrismaModule, BitacoraModule],
  controllers: [ProveedoresController],
  providers: [ProveedoresService],
})
export class ProveedoresModule {}
