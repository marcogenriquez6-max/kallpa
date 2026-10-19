import {
  Body,
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../common/usuario-sesion';
import { Rol } from '../generated/prisma/enums';
import { ActualizarInsumoDto, CrearInsumoDto } from './dto/insumo.dto';
import { InsumosService } from './insumos.service';

/** Catálogo de insumos: materia prima que consumen las fichas técnicas. */
@Controller('insumos')
export class InsumosController {
  constructor(private readonly insumos: InsumosService) {}

  @Get()
  listar(
    @Query('categoriaId', new ParseIntPipe({ optional: true })) categoriaId?: number,
    @Query('activo', new ParseBoolPipe({ optional: true })) activo?: boolean,
    @Query('q') q?: string,
  ) {
    return this.insumos.listar({ categoriaId, activo, q: q?.trim() || undefined });
  }

  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.insumos.obtener(id);
  }

  @Post()
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO)
  crear(@Body() dto: CrearInsumoDto, @UsuarioActual() autor: UsuarioSesion) {
    return this.insumos.crear(dto, autor.id);
  }

  @Patch(':id')
  @Roles(Rol.GERENTE, Rol.GERENTE_GASTRONOMICO)
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarInsumoDto,
    @UsuarioActual() autor: UsuarioSesion,
  ) {
    return this.insumos.actualizar(id, dto, autor.id);
  }
}
