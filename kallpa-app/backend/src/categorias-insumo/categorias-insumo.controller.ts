import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../common/usuario-sesion';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../generated/prisma/enums';
import { CategoriasInsumoService } from './categorias-insumo.service';
import { ActualizarCategoriaInsumoDto, CrearCategoriaInsumoDto } from './categorias-insumo.dto';

@Controller('categorias-insumo')
export class CategoriasInsumoController {
  constructor(private readonly categorias: CategoriasInsumoService) {}

  @Get()
  listar() {
    return this.categorias.listar();
  }

  @Post()
  @Roles(Rol.GERENTE)
  crear(@Body() dto: CrearCategoriaInsumoDto, @UsuarioActual() autor: UsuarioSesion) {
    return this.categorias.crear(dto, autor.id);
  }

  @Patch(':id')
  @Roles(Rol.GERENTE)
  actualizar(@Param('id') id: string, @Body() dto: ActualizarCategoriaInsumoDto, @UsuarioActual() autor: UsuarioSesion) {
    return this.categorias.actualizar(id, dto, autor.id);
  }
}
