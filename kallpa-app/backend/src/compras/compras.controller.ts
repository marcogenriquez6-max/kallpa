import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../common/usuario-sesion';
import { Rol } from '../generated/prisma/enums';
import { CrearCompraDto } from './compras.dto';
import { ComprasService } from './compras.service';

@Controller('compras')
export class ComprasController {
  constructor(private readonly compras: ComprasService) {}

  @Get()
  listar(@Query('solicitudId') solicitudId?: string, @Query('proveedorId') proveedorId?: string) {
    return this.compras.listar({ solicitudId: solicitudId || undefined, proveedorId: proveedorId || undefined });
  }

  @Post()
  @Roles(Rol.GERENTE, Rol.LOGISTICA)
  crear(@Body() dto: CrearCompraDto, @UsuarioActual() u: UsuarioSesion) {
    return this.compras.crear(dto, u.id);
  }
}
