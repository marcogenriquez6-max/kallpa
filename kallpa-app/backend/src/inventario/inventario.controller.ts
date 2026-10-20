import {
  Body,
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  ParseEnumPipe,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../common/usuario-sesion';
import { MotivoMovimiento, Rol, TipoMovimiento } from '../generated/prisma/enums';
import { CrearMovimientoDto } from './dto/movimiento.dto';
import { InventarioService } from './inventario.service';

/** Existencias por insumo y kardex de movimientos de almacén. */
@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventario: InventarioService) {}

  @Get('existencias')
  existencias(
    @Query('categoriaId', new ParseIntPipe({ optional: true })) categoriaId?: number,
    @Query('bajoMinimo', new ParseBoolPipe({ optional: true })) bajoMinimo?: boolean,
    @Query('q') q?: string,
  ) {
    return this.inventario.listarExistencias({
      categoriaId,
      bajoMinimo,
      q: q?.trim() || undefined,
    });
  }

  @Get('resumen')
  resumen() {
    return this.inventario.resumen();
  }

  @Get('movimientos')
  movimientos(
    @Query('insumoId', new ParseUUIDPipe({ optional: true })) insumoId?: string,
    @Query('tipo', new ParseEnumPipe(TipoMovimiento, { optional: true })) tipo?: TipoMovimiento,
    @Query('motivo', new ParseEnumPipe(MotivoMovimiento, { optional: true }))
    motivo?: MotivoMovimiento,
    @Query('contratoId', new ParseUUIDPipe({ optional: true })) contratoId?: string,
    @Query('limite', new ParseIntPipe({ optional: true })) limite?: number,
  ) {
    return this.inventario.listarMovimientos({ insumoId, tipo, motivo, contratoId, limite });
  }

  @Get('insumos/:insumoId/movimientos')
  movimientosDeInsumo(
    @Param('insumoId', ParseUUIDPipe) insumoId: string,
    @Query('limite', new ParseIntPipe({ optional: true })) limite?: number,
  ) {
    return this.inventario.movimientosDeInsumo(insumoId, limite);
  }

  @Post('movimientos')
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO, Rol.LOGISTICA)
  registrar(@Body() dto: CrearMovimientoDto, @UsuarioActual() autor: UsuarioSesion) {
    return this.inventario.registrar(dto, autor.id);
  }
}
