import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { BitacoraService } from '../bitacora/bitacora.service';
import { PrismaService } from '../prisma/prisma.service';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { LoginDto } from './dto/login.dto';

export const RONDAS_BCRYPT = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly bitacora: BitacoraService,
  ) {}

  async login({ email, password }: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    // Mismo mensaje para correo inexistente y contraseña errónea:
    // no se revela qué correos están registrados.
    const valido = usuario?.activo && (await bcrypt.compare(password, usuario.passwordHash));
    if (!usuario || !valido) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoAcceso: new Date() },
    });
    await this.bitacora.registrar({
      entidad: 'Usuario',
      entidadId: usuario.id,
      accion: 'INGRESO',
      usuarioId: usuario.id,
    });

    return {
      token: await this.jwt.signAsync({ sub: usuario.id, rol: usuario.rol }),
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        debeCambiarPassword: usuario.debeCambiarPassword,
      },
    };
  }

  perfil(usuarioId: string) {
    return this.prisma.usuario.findUniqueOrThrow({
      where: { id: usuarioId },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        debeCambiarPassword: true,
        ultimoAcceso: true,
      },
    });
  }

  async cambiarPassword(usuarioId: string, dto: CambiarPasswordDto) {
    const usuario = await this.prisma.usuario.findUniqueOrThrow({ where: { id: usuarioId } });
    if (!(await bcrypt.compare(dto.passwordActual, usuario.passwordHash))) {
      throw new BadRequestException('La contraseña actual no es correcta');
    }
    if (dto.passwordActual === dto.passwordNueva) {
      throw new BadRequestException('La nueva contraseña debe ser distinta de la actual');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: { id: usuarioId },
        data: {
          passwordHash: await bcrypt.hash(dto.passwordNueva, RONDAS_BCRYPT),
          debeCambiarPassword: false,
        },
      });
      await this.bitacora.registrar(
        { entidad: 'Usuario', entidadId: usuarioId, accion: 'CAMBIO_PASSWORD', usuarioId },
        tx,
      );
    });
    return { mensaje: 'Contraseña actualizada' };
  }
}
