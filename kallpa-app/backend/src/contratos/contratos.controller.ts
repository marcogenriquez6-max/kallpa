import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../common/usuario-sesion';
import { EstadoContrato, Rol } from '../generated/prisma/enums';
import { ContratosService } from './contratos.service';
import {
  ActualizarContratoDto,
  CrearContratoDto,
  ReemplazarItemsDto,
} from './dto/contrato.dto';
import { CambiarEstadoDto, ConfirmarPlatosDto } from './dto/estado.dto';
import { CrearPagoDto } from './dto/pago.dto';

@Controller('contratos')
export class ContratosController {
  constructor(private readonly contratos: ContratosService) {}

  @Get()
  listar(
    @Query('estado') estado?: EstadoContrato,
    @Query('clienteId') clienteId?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('q') q?: string,
  ) {
    return this.contratos.listar({ estado, clienteId, desde, hasta, q: q?.trim() || undefined });
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

  @Put(':id/items')
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO)
  reemplazarItems(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReemplazarItemsDto,
    @UsuarioActual() autor: UsuarioSesion,
  ) {
    return this.contratos.reemplazarItems(id, dto, autor.id);
  }

  @Post(':id/pagos')
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO)
  registrarPago(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CrearPagoDto,
    @UsuarioActual() autor: UsuarioSesion,
  ) {
    return this.contratos.registrarPago(id, dto, autor.id);
  }

  @Post(':id/confirmar-platos')
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO)
  confirmarPlatos(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmarPlatosDto,
    @UsuarioActual() autor: UsuarioSesion,
  ) {
    return this.contratos.confirmarPlatos(id, dto, autor.id);
  }

  @Patch(':id/estado')
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO)
  cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CambiarEstadoDto,
    @UsuarioActual() autor: UsuarioSesion,
  ) {
    return this.contratos.cambiarEstado(id, dto, autor.id);
  }
}
