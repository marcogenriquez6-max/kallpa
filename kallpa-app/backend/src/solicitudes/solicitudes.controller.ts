import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../common/usuario-sesion';
import { EstadoSolicitud, Rol } from '../generated/prisma/enums';
import { SolicitudesService } from './solicitudes.service';
import {
  ActualizarItemSolicitudDto,
  AgregarItemSolicitudDto,
  AnularSolicitudDto,
  CrearSolicitudDto,
} from './dto/solicitud.dto';

/**
 * Solicitud de insumos (F-001): explosión de insumos del menú, revisión del chef
 * y aprobación. Lectura abierta a usuarios autenticados; escritura del área
 * gastronómica.
 */
@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly solicitudes: SolicitudesService) {}

  @Get()
  listar(@Query('contratoId') contratoId?: string, @Query('estado') estado?: EstadoSolicitud) {
    return this.solicitudes.listar({ contratoId, estado });
  }

  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.solicitudes.obtener(id);
  }

  @Post()
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO)
  generar(@Body() dto: CrearSolicitudDto, @UsuarioActual() autor: UsuarioSesion) {
    return this.solicitudes.generar(dto, autor.id);
  }

  @Post(':id/items')
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO)
  agregarItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AgregarItemSolicitudDto,
    @UsuarioActual() autor: UsuarioSesion,
  ) {
    return this.solicitudes.agregarItem(id, dto, autor.id);
  }

  @Patch(':id/items/:itemId')
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO)
  actualizarItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: ActualizarItemSolicitudDto,
    @UsuarioActual() autor: UsuarioSesion,
  ) {
    return this.solicitudes.actualizarItem(id, itemId, dto, autor.id);
  }

  @Delete(':id/items/:itemId')
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO)
  eliminarItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @UsuarioActual() autor: UsuarioSesion,
  ) {
    return this.solicitudes.eliminarItem(id, itemId, autor.id);
  }

  @Post(':id/aprobar')
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO)
  aprobar(@Param('id', ParseUUIDPipe) id: string, @UsuarioActual() autor: UsuarioSesion) {
    return this.solicitudes.aprobar(id, autor.id);
  }

  @Post(':id/anular')
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO)
  anular(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AnularSolicitudDto,
    @UsuarioActual() autor: UsuarioSesion,
  ) {
    return this.solicitudes.anular(id, dto, autor.id);
  }
}
