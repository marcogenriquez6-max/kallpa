import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../common/usuario-sesion';
import { Rol } from '../generated/prisma/enums';
import { ActualizarParametroDto } from './dto/actualizar-parametro.dto';
import { ParametrosService } from './parametros.service';

@Controller('parametros')
export class ParametrosController {
  constructor(private readonly parametros: ParametrosService) {}

  /** Todos los roles pueden consultar las reglas vigentes. */
  @Get()
  listar() {
    return this.parametros.listar();
  }

  @Patch(':clave')
  @Roles(Rol.GERENTE)
  actualizar(
    @Param('clave') clave: string,
    @Body() dto: ActualizarParametroDto,
    @UsuarioActual() usuario: UsuarioSesion,
  ) {
    return this.parametros.actualizar(clave, dto.valor, usuario.id);
  }
}
