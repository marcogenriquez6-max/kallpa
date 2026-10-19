import { Module } from '@nestjs/common';
import { CatalogoController } from './catalogo.controller';
import { CatalogoService } from './catalogo.service';
import { CategoriasController } from './categorias.controller';
import { CategoriasService } from './categorias.service';
import { InsumosController } from './insumos.controller';
import { InsumosService } from './insumos.service';
import { UnidadesController } from './unidades.controller';
import { UnidadesService } from './unidades.service';

/**
 * Catálogo y fichas técnicas: unidades de medida, categorías e insumos,
 * ítems de venta y sus recetas versionadas con costeo teórico.
 */
@Module({
  controllers: [
    UnidadesController,
    CategoriasController,
    InsumosController,
    CatalogoController,
  ],
  providers: [UnidadesService, CategoriasService, InsumosService, CatalogoService],
})
export class CatalogoModule {}
