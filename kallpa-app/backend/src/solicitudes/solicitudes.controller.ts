import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../common/usuario-sesion';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../generated/prisma/enums';
import { SolicitudesService } from './solicitudes.service';
import { ActualizarSolicitudDto, CrearSolicitudDto } from './solicitudes.dto';

@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly solicitudes: SolicitudesService) {}

  @Get()
  listar(@Query('estado') estado?: string) {
    return this.solicitudes.listar({ estado });
  }

  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.solicitudes.obtener(id);
  }

  @Post()
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO, Rol.LOGISTICA, Rol.COCINA)
  crear(@Body() dto: CrearSolicitudDto, @UsuarioActual() autor: UsuarioSesion) {
    return this.solicitudes.crear(dto, autor.id);
  }

  @Patch(':id')
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO, Rol.LOGISTICA)
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarSolicitudDto,
    @UsuarioActual() autor: UsuarioSesion,
  ) {
    return this.solicitudes.actualizar(id, dto, autor.id);
  }
}
