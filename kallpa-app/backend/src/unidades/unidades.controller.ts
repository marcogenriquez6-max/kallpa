import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../common/usuario-sesion';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../generated/prisma/enums';
import { UnidadesService } from './unidades.service';
import { ActualizarUnidadDto, CrearUnidadDto } from './unidades.dto';

@Controller('unidades')
export class UnidadesController {
  constructor(private readonly unidades: UnidadesService) {}

  @Get()
  listar() {
    return this.unidades.listar();
  }

  @Post()
  @Roles(Rol.GERENTE)
  crear(@Body() dto: CrearUnidadDto, @UsuarioActual() autor: UsuarioSesion) {
    return this.unidades.crear(dto, autor.id);
  }

  @Patch(':codigo')
  @Roles(Rol.GERENTE)
  actualizar(@Param('codigo') codigo: string, @Body() dto: ActualizarUnidadDto, @UsuarioActual() autor: UsuarioSesion) {
    return this.unidades.actualizar(codigo, dto, autor.id);
  }
}
