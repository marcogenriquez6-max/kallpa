import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UsuarioSesion } from '../../common/usuario-sesion';

/** Inyecta en el controlador el usuario autenticado. */
export const UsuarioActual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioSesion =>
    ctx.switchToHttp().getRequest().usuario,
);
