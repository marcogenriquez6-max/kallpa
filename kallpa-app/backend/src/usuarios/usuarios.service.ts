import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { RONDAS_BCRYPT } from '../auth/auth.service';
import { BitacoraService } from '../bitacora/bitacora.service';
import { Rol } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';

/** Campos visibles de un usuario: nunca se devuelve el hash de la contraseña. */
const CAMPOS_PUBLICOS = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  activo: true,
  debeCambiarPassword: true,
  ultimoAcceso: true,
  creadoEn: true,
  personaId: true,
} as const;

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  listar() {
    return this.prisma.usuario.findMany({ select: CAMPOS_PUBLICOS, orderBy: { nombre: 'asc' } });
  }

  async crear(dto: CrearUsuarioDto, autorId: string) {
    const email = dto.email.toLowerCase().trim();
    if (await this.prisma.usuario.findUnique({ where: { email } })) {
      throw new ConflictException('Ya existe un usuario con ese correo');
    }

    return this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nombre: dto.nombre.trim(),
          email,
          rol: dto.rol,
          personaId: dto.personaId,
          passwordHash: await bcrypt.hash(dto.passwordTemporal, RONDAS_BCRYPT),
          debeCambiarPassword: true,
        },
        select: CAMPOS_PUBLICOS,
      });
      await this.bitacora.registrar(
        {
          entidad: 'Usuario',
          entidadId: usuario.id,
          accion: 'CREAR',
          usuarioId: autorId,
          detalle: { nombre: usuario.nombre, email, rol: usuario.rol },
        },
        tx,
      );
      return usuario;
    });
  }

  async actualizar(id: string, dto: ActualizarUsuarioDto, autorId: string) {
    const actual = await this.prisma.usuario.findUniqueOrThrow({ where: { id } });

    const pierdeGerencia =
      actual.rol === Rol.GERENTE && ((dto.rol && dto.rol !== Rol.GERENTE) || dto.activo === false);
    if (pierdeGerencia) {
      if (id === autorId) {
        throw new BadRequestException('No puede quitarse a sí misma el rol de gerente ni desactivarse');
      }
      const gerentesActivos = await this.prisma.usuario.count({
        where: { rol: Rol.GERENTE, activo: true },
      });
      if (gerentesActivos <= 1) {
        throw new BadRequestException('Debe existir al menos un gerente activo');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.update({ where: { id }, data: dto, select: CAMPOS_PUBLICOS });
      await this.bitacora.registrar(
        {
          entidad: 'Usuario',
          entidadId: id,
          accion: 'EDITAR',
          usuarioId: autorId,
          detalle: {
            antes: { nombre: actual.nombre, rol: actual.rol, activo: actual.activo },
            despues: { ...dto },
          },
        },
        tx,
      );
      return usuario;
    });
  }

  async restablecerPassword(id: string, passwordTemporal: string, autorId: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: { id },
        data: {
          passwordHash: await bcrypt.hash(passwordTemporal, RONDAS_BCRYPT),
          debeCambiarPassword: true,
        },
      });
      await this.bitacora.registrar(
        {
          entidad: 'Usuario',
          entidadId: id,
          accion: 'CAMBIO_PASSWORD',
          usuarioId: autorId,
          detalle: { tipo: 'restablecida por gerencia' },
        },
        tx,
      );
    });
    return { mensaje: 'Contraseña restablecida; el usuario deberá cambiarla al ingresar' };
  }
}
