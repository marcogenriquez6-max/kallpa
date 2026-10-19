import {
  Body,
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../common/usuario-sesion';
import { LineaCatalogo, Rol, TipoItemCatalogo } from '../generated/prisma/enums';
import { CatalogoService } from './catalogo.service';
import { CrearFichaDto } from './dto/ficha.dto';
import { ActualizarItemCatalogoDto, CrearItemCatalogoDto } from './dto/item-catalogo.dto';

/** Ítems del catálogo (venta) y sus fichas técnicas versionadas. */
@Controller('catalogo')
export class CatalogoController {
  constructor(private readonly catalogo: CatalogoService) {}

  // ----- Ítems -----

  @Get('items')
  listarItems(
    @Query('tipo') tipo?: TipoItemCatalogo,
    @Query('linea') linea?: LineaCatalogo,
    @Query('activo', new ParseBoolPipe({ optional: true })) activo?: boolean,
    @Query('q') q?: string,
  ) {
    return this.catalogo.listarItems({ tipo, linea, activo, q: q?.trim() || undefined });
  }

  @Get('items/:id')
  obtenerItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogo.obtenerItem(id);
  }

  @Post('items')
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO)
  crearItem(@Body() dto: CrearItemCatalogoDto, @UsuarioActual() autor: UsuarioSesion) {
    return this.catalogo.crearItem(dto, autor.id);
  }

  @Patch('items/:id')
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO)
  actualizarItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarItemCatalogoDto,
    @UsuarioActual() autor: UsuarioSesion,
  ) {
    return this.catalogo.actualizarItem(id, dto, autor.id);
  }

  // ----- Fichas técnicas -----

  @Get('items/:itemId/fichas')
  listarFichas(@Param('itemId', ParseUUIDPipe) itemId: string) {
    return this.catalogo.listarFichas(itemId);
  }

  @Post('items/:itemId/fichas')
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO)
  crearFicha(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: CrearFichaDto,
    @UsuarioActual() autor: UsuarioSesion,
  ) {
    return this.catalogo.crearFicha(itemId, dto, autor.id);
  }

  @Get('fichas/:id')
  obtenerFicha(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogo.obtenerFicha(id);
  }

  @Get('fichas/:id/costo')
  costoFicha(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogo.costoFicha(id);
  }
}
