import {
  Body,
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../common/usuario-sesion';
import { Rol } from '../generated/prisma/enums';
import { RegistrarPrecioDto } from './dto/precio.dto';
import { ActualizarProveedorDto, CrearProveedorDto } from './dto/proveedor.dto';
import { ProveedoresService } from './proveedores.service';

@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly proveedores: ProveedoresService) {}

  @Get()
  listar(
    @Query('activo', new ParseBoolPipe({ optional: true })) activo?: boolean,
    @Query('q') q?: string,
  ) {
    return this.proveedores.listar({ activo, q: q?.trim() || undefined });
  }

  // Ruta específica declarada antes de ':id' para que no la capture.
  @Get('precios-insumo/:insumoId')
  preciosPorInsumo(@Param('insumoId', ParseUUIDPipe) insumoId: string) {
    return this.proveedores.preciosPorInsumo(insumoId);
  }

  @Get(':id/precios')
  listarPrecios(@Param('id', ParseUUIDPipe) id: string) {
    return this.proveedores.obtener(id).then(() => this.proveedores.listarPrecios(id));
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

  @Post(':id/precios')
  @Roles(Rol.GERENTE, Rol.LOGISTICA)
  registrarPrecio(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegistrarPrecioDto,
    @UsuarioActual() autor: UsuarioSesion,
  ) {
    return this.proveedores.registrarPrecio(id, dto, autor.id);
  }
}
