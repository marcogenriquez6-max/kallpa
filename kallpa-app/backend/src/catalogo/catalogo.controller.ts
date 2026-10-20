import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../common/usuario-sesion';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../generated/prisma/enums';
import { CatalogoService } from './catalogo.service';
import { ActualizarItemCatalogoDto } from './dto/actualizar-item.dto';
import { CrearItemCatalogoDto } from './dto/crear-item.dto';
import { GuardarFichaTecnicaDto } from './dto/ficha-tecnica.dto';

@Controller('catalogo')
export class CatalogoController {
  constructor(private readonly catalogo: CatalogoService) {}

  @Get('items')
  listarItems(
    @Query('tipo') tipo?: string,
    @Query('linea') linea?: string,
    @Query('activo') activo?: string,
  ) {
    return this.catalogo.listar({ tipo, linea, activo });
  }

  @Get('items/:id')
  obtenerItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogo.obtener(id);
  }

  @Post('items')
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO)
  crearItem(@Body() dto: CrearItemCatalogoDto, @UsuarioActual() autor: UsuarioSesion) {
    return this.catalogo.crear(dto, autor.id);
  }

  @Patch('items/:id')
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO)
  actualizarItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarItemCatalogoDto,
    @UsuarioActual() autor: UsuarioSesion,
  ) {
    return this.catalogo.actualizar(id, dto, autor.id);
  }

  @Post('items/:id/ficha-tecnica')
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO)
  guardarFichaTecnica(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GuardarFichaTecnicaDto,
    @UsuarioActual() autor: UsuarioSesion,
  ) {
    return this.catalogo.guardarFichaTecnica(id, dto, autor.id);
  }
}
