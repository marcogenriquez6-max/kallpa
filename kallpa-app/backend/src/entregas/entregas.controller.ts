import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../common/usuario-sesion';
import { Rol } from '../generated/prisma/enums';
import { CrearEntregaDto } from './entregas.dto';
import { EntregasService } from './entregas.service';

@Controller('entregas')
export class EntregasController {
  constructor(private readonly entregas: EntregasService) {}

  @Get()
  listar(@Query('solicitudId') solicitudId?: string) {
    return this.entregas.listar(solicitudId || undefined);
  }

  @Get('receptores')
  receptores() {
    return this.entregas.receptores();
  }

  @Post()
  @Roles(Rol.GERENTE, Rol.LOGISTICA, Rol.COCINA)
  crear(@Body() dto: CrearEntregaDto, @UsuarioActual() u: UsuarioSesion) {
    return this.entregas.crear(dto, u.id);
  }
}
