import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../common/usuario-sesion';
import { Rol } from '../generated/prisma/enums';
import { ComprasService } from './compras.service';
import { CrearCompraDto, ActualizarCompraDto } from './dto/compra.dto';

@Controller('compras')
export class ComprasController {
  constructor(private readonly compras: ComprasService) {}

  @Get()
  listar(@Query('activo', new ParseBoolPipe({ optional: true })) activo?: boolean) {
    return this.compras.listar(activo);
  }

  @Post()
  @Roles(Rol.GERENTE, Rol.LOGISTICA)
  crear(@Body() dto: CrearCompraDto, @UsuarioActual() autor: UsuarioSesion) {
    return this.compras.crear(dto, autor.id);
  }

  @Post(':id/recepcionar')
  @Roles(Rol.LOGISTICA)
  recepcionar(
    @Param('id', ParseUUIDPipe) compraId: string,
    @Body() dto: { cantidad: number; proveedorInsumoId: string; observacion?: string },
    @UsuarioActual() autor: UsuarioSesion,
  ) {
    return this.compras.recepcionar(compraId, dto.cantidad, dto.proveedorInsumoId, dto.observacion, autor.id);
  }
