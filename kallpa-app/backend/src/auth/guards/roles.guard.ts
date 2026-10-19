import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsuarioSesion } from '../../common/usuario-sesion';
import { Rol } from '../../generated/prisma/enums';
import { ES_PUBLICO } from '../decorators/publico.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const objetivos = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(ES_PUBLICO, objetivos)) return true;

    const requeridos = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, objetivos);
    if (!requeridos || requeridos.length === 0) return true; // basta con estar autenticado

    const usuario: UsuarioSesion | undefined = ctx.switchToHttp().getRequest().usuario;
    if (!usuario || !requeridos.includes(usuario.rol)) {
      throw new ForbiddenException('Su rol no tiene permiso para esta operación');
    }
    return true;
  }
}
