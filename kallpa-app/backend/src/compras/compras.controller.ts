import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../common/usuario-sesion';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../generated/prisma/enums';
import { ComprasService } from './compras.service';
import { CrearCompraDto } from './compras.dto';

@Controller('compras')
export class ComprasController {
  constructor(private readonly compras: ComprasService) {}

  @Get()
  listar(@Query('proveedorId') proveedorId?: string) {
    return this.compras.listar({ proveedorId });
  }

  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.compras.obtener(id);
  }

  @Post()
  @Roles(Rol.GERENTE, Rol.LOGISTICA)
  crear(@Body() dto: CrearCompraDto, @UsuarioActual() autor: UsuarioSesion) {
    return this.compras.crear(dto, autor.id);
  }
}
