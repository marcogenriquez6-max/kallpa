import { Module } from '@nestjs/common';
import { BitacoraModule } from '../bitacora/bitacora.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CategoriasController } from './categorias.controller';
import { CategoriasInsumoController } from './categorias-insumo.controller';
import { CategoriasInsumoService } from './categorias-insumo.service';

@Module({
  imports: [PrismaModule, BitacoraModule],
  controllers: [CategoriasInsumoController, CategoriasController],
  providers: [CategoriasInsumoService],
})
export class CategoriasInsumoModule {}
