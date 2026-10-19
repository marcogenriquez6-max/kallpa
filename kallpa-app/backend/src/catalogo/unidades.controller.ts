import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../common/usuario-sesion';
import { Rol } from '../generated/prisma/enums';
import { ActualizarUnidadDto, CrearUnidadDto } from './dto/unidad.dto';
import { UnidadesService } from './unidades.service';

/** Unidades de medida. Todos consultan; la gestión es del área gastronómica. */
@Controller('unidades')
export class UnidadesController {
  constructor(private readonly unidades: UnidadesService) {}

  @Get()
  listar() {
    return this.unidades.listar();
  }

  @Post()
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO)
  crear(@Body() dto: CrearUnidadDto, @UsuarioActual() autor: UsuarioSesion) {
    return this.unidades.crear(dto, autor.id);
  }

  @Patch(':codigo')
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO)
  actualizar(
    @Param('codigo') codigo: string,
    @Body() dto: ActualizarUnidadDto,
    @UsuarioActual() autor: UsuarioSesion,
  ) {
    return this.unidades.actualizar(codigo.toUpperCase(), dto, autor.id);
  }
}
