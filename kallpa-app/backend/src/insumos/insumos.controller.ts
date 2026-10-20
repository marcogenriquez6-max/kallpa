import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../common/usuario-sesion';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../generated/prisma/enums';
import { InsumosService } from './insumos.service';
import { ActualizarInsumoDto, CrearInsumoDto } from './insumos.dto';

@Controller('insumos')
export class InsumosController {
  constructor(private readonly insumos: InsumosService) {}

  @Get()
  listar(@Query('activo') activo?: string, @Query('categoriaId') categoriaId?: string) {
    return this.insumos.listar({ activo, categoriaId });
  }

  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.insumos.obtener(id);
  }

  @Post()
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO, Rol.LOGISTICA)
  crear(@Body() dto: CrearInsumoDto, @UsuarioActual() autor: UsuarioSesion) {
    return this.insumos.crear(dto, autor.id);
  }

  @Patch(':id')
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO, Rol.LOGISTICA)
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarInsumoDto,
    @UsuarioActual() autor: UsuarioSesion,
  ) {
    return this.insumos.actualizar(id, dto, autor.id);
  }
}
