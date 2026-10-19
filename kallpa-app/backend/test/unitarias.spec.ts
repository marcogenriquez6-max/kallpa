import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { aBs } from '../src/catalogo/catalogo.service';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { ES_PUBLICO } from '../src/auth/decorators/publico.decorator';
import { ROLES_KEY } from '../src/auth/decorators/roles.decorator';
import { Rol } from '../src/generated/prisma/enums';
import { PARAMETROS } from '../src/parametros/parametros.definicion';

describe('aBs (redondeo comercial)', () => {
  it('evita errores de coma flotante', () => {
    expect(aBs(0.1 + 0.2)).toBe(0.3);
    expect(aBs(1.005)).toBe(1.01);
    expect(aBs(12.344)).toBe(12.34);
    expect(aBs(12.345)).toBe(12.35);
  });
});

describe('Definición de parámetros de negocio', () => {
  it('todos tienen rango coherente y descripción', () => {
    for (const [clave, def] of Object.entries(PARAMETROS)) {
      expect(def.min, `${clave}.min`).toBeLessThan(def.max);
      expect(def.valor, `${clave}.valor >= min`).toBeGreaterThanOrEqual(def.min);
      expect(def.valor, `${clave}.valor <= max`).toBeLessThanOrEqual(def.max);
      expect(def.descripcion.length, `${clave}.descripcion`).toBeGreaterThan(0);
    }
  });
});

describe('RolesGuard', () => {
  const usuario: { id: string; nombre: string; email: string; rol: Rol } = {
    id: 'u1',
    nombre: 'Prueba',
    email: 'prueba@kallpa.bo',
    rol: Rol.LOGISTICA,
  };

  function montar(opciones: { publico?: boolean; roles?: Rol[]; sesion?: typeof usuario }) {
    const reflector = {
      getAllAndOverride: (clave: string) =>
        clave === ES_PUBLICO ? opciones.publico ?? false : opciones.roles,
    } as unknown as Reflector;
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ usuario: opciones.sesion }) }),
    } as never;
    return new RolesGuard(reflector).canActivate(ctx);
  }

  it('permite endpoints públicos', () => {
    expect(montar({ publico: true })).toBe(true);
  });

  it('permite cuando no se exige rol (solo autenticación)', () => {
    expect(montar({ roles: [], sesion: usuario })).toBe(true);
  });

  it('permite si el rol está entre los requeridos', () => {
    expect(montar({ roles: [Rol.GERENTE, Rol.LOGISTICA], sesion: usuario })).toBe(true);
  });

  it('niega si el rol no está permitido', () => {
    expect(() => montar({ roles: [Rol.GERENTE], sesion: usuario })).toThrow(ForbiddenException);
  });

  it('niega si no hay sesión', () => {
    expect(() => montar({ roles: [Rol.GERENTE] })).toThrow(ForbiddenException);
  });
});
