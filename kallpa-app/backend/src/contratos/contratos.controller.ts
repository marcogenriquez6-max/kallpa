import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../common/usuario-sesion';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../generated/prisma/enums';
import { ContratosService } from './contratos.service';
import { ActualizarContratoDto, CrearContratoDto } from './contratos.dto';

@Controller('contratos')
export class ContratosController {
  constructor(private readonly contratos: ContratosService) {}

  @Get()
  listar(@Query('estado') estado?: string, @Query('clienteId') clienteId?: string) {
    return this.contratos.listar({ estado, clienteId });
  }

  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.contratos.obtener(id);
  }

  @Post()
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO)
  crear(@Body() dto: CrearContratoDto, @UsuarioActual() autor: UsuarioSesion) {
    return this.contratos.crear(dto, autor.id);
  }

  @Patch(':id')
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO)
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarContratoDto,
    @UsuarioActual() autor: UsuarioSesion,
  ) {
    return this.contratos.actualizar(id, dto, autor.id);
  }
}
