import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../common/usuario-sesion';
import { Rol } from '../generated/prisma/enums';
import { ClientesService } from './clientes.service';
import { ActualizarClienteDto, CrearClienteDto } from './dto/cliente.dto';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientes: ClientesService) {}

  @Get()
  listar(@Query('q') q?: string) {
    return this.clientes.listar(q?.trim() || undefined);
  }

  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientes.obtener(id);
  }

  @Post()
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO)
  crear(@Body() dto: CrearClienteDto, @UsuarioActual() autor: UsuarioSesion) {
    return this.clientes.crear(dto, autor.id);
  }

  @Patch(':id')
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO)
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarClienteDto,
    @UsuarioActual() autor: UsuarioSesion,
  ) {
    return this.clientes.actualizar(id, dto, autor.id);
  }
}
