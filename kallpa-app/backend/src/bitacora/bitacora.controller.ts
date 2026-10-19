import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../generated/prisma/enums';
import { BitacoraService } from './bitacora.service';

@Controller('bitacora')
@Roles(Rol.GERENTE, Rol.CONSULTA)
export class BitacoraController {
  constructor(private readonly bitacora: BitacoraService) {}

  @Get()
  async listar(
    @Query('entidad') entidad?: string,
    @Query('entidadId') entidadId?: string,
    @Query('limite', new ParseIntPipe({ optional: true })) limite?: number,
  ) {
    const filas = await this.bitacora.listar({ entidad, entidadId, limite });
    // BigInt no se serializa a JSON de forma nativa
    return filas.map((f) => ({ ...f, id: f.id.toString() }));
  }
}
