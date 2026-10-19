import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../common/usuario-sesion';
import { Rol } from '../generated/prisma/enums';
import { ActualizarUsuarioDto, RestablecerPasswordDto } from './dto/actualizar-usuario.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { UsuariosService } from './usuarios.service';

/** Administración de usuarios: exclusiva de la gerente. */
@Controller('usuarios')
@Roles(Rol.GERENTE)
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  listar() {
    return this.usuarios.listar();
  }

  @Post()
  crear(@Body() dto: CrearUsuarioDto, @UsuarioActual() autor: UsuarioSesion) {
    return this.usuarios.crear(dto, autor.id);
  }

  @Patch(':id')
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarUsuarioDto,
    @UsuarioActual() autor: UsuarioSesion,
  ) {
    return this.usuarios.actualizar(id, dto, autor.id);
  }

  @Post(':id/restablecer-password')
  @HttpCode(200)
  restablecer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RestablecerPasswordDto,
    @UsuarioActual() autor: UsuarioSesion,
  ) {
    return this.usuarios.restablecerPassword(id, dto.passwordTemporal, autor.id);
  }
}
