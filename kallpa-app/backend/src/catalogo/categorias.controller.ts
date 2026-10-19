import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../common/usuario-sesion';
import { Rol } from '../generated/prisma/enums';
import { ActualizarCategoriaDto, CrearCategoriaDto } from './dto/categoria.dto';
import { CategoriasService } from './categorias.service';

/** Categorías de insumos (Proteínas, Vegetales, Abarrotes…). */
@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categorias: CategoriasService) {}

  @Get()
  listar() {
    return this.categorias.listar();
  }

  @Post()
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO)
  crear(@Body() dto: CrearCategoriaDto, @UsuarioActual() autor: UsuarioSesion) {
    return this.categorias.crear(dto, autor.id);
  }

  @Patch(':id')
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO)
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarCategoriaDto,
    @UsuarioActual() autor: UsuarioSesion,
  ) {
    return this.categorias.actualizar(id, dto, autor.id);
  }
}
