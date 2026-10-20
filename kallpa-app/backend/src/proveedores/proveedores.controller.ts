import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../common/usuario-sesion';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../generated/prisma/enums';
import { ProveedoresService } from './proveedores.service';
import { ActualizarProveedorDto, AgregarProveedorInsumoDto, CrearProveedorDto } from './proveedores.dto';

@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly proveedores: ProveedoresService) {}

  @Get()
  listar(@Query('activo') activo?: string) {
    return this.proveedores.listar({ activo });
  }

  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.proveedores.obtener(id);
  }

  @Post()
  @Roles(Rol.GERENTE, Rol.LOGISTICA)
  crear(@Body() dto: CrearProveedorDto, @UsuarioActual() autor: UsuarioSesion) {
    return this.proveedores.crear(dto, autor.id);
  }

  @Patch(':id')
  @Roles(Rol.GERENTE, Rol.LOGISTICA)
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarProveedorDto,
    @UsuarioActual() autor: UsuarioSesion,
  ) {
    return this.proveedores.actualizar(id, dto, autor.id);
  }

  @Post(':id/insumos')
  @Roles(Rol.GERENTE, Rol.LOGISTICA)
  agregarInsumo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AgregarProveedorInsumoDto,
    @UsuarioActual() autor: UsuarioSesion,
  ) {
    return this.proveedores.agregarInsumo(id, dto, autor.id);
  }

  @Delete(':id/insumos/:insumoId')
  @Roles(Rol.GERENTE, Rol.LOGISTICA)
  quitarInsumo(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('insumoId', ParseUUIDPipe) insumoId: string,
    @UsuarioActual() autor: UsuarioSesion,
  ) {
    return this.proveedores.quitarInsumo(id, insumoId, autor.id);
  }
}
