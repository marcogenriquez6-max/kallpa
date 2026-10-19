import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { ES_PUBLICO } from '../decorators/publico.decorator';

interface PayloadToken {
  sub: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const esPublico = this.reflector.getAllAndOverride<boolean>(ES_PUBLICO, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (esPublico) return true;

    const req = ctx.switchToHttp().getRequest();
    const [tipo, token] = (req.headers.authorization ?? '').split(' ');
    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Debe iniciar sesión');
    }

    let payload: PayloadToken;
    try {
      payload = await this.jwt.verifyAsync<PayloadToken>(token);
    } catch {
      throw new UnauthorizedException('Sesión inválida o vencida');
    }

    // Se consulta la base en cada petición: si la gerente desactiva a un usuario
    // o le cambia el rol, el efecto es inmediato aunque su token siga vigente.
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: { id: true, nombre: true, email: true, rol: true, activo: true },
    });
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Usuario inactivo o inexistente');
    }

    const { activo: _activo, ...sesion } = usuario;
    req.usuario = sesion;
    return true;
  }
}
