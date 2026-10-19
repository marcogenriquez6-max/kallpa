import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaExceptionFilter } from '../src/common/prisma-exception.filter';

/** Correos de los usuarios sembrados (seed) por rol. */
export const USUARIOS = {
  gerente: 'maribel@kallpa.bo',
  gerenteGastronomico: 'percy@kallpa.bo',
  logistica: 'victor@kallpa.bo',
} as const;

export const PASSWORD_SEED = process.env.SEED_PASSWORD ?? 'Kallpa2026!';

/** Levanta la aplicación Nest con la misma configuración que main.ts. */
export async function crearAplicacion(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());
  await app.init();
  return app;
}

export function cabecera(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

/** Inicia sesión y devuelve el token de acceso. */
export async function iniciarSesion(
  app: INestApplication,
  email: string,
  password: string = PASSWORD_SEED,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password });
  if (res.status !== 200) {
    throw new Error(`Login falló para ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.token as string;
}

/** Sufijo único por corrida para no chocar con datos previos en la base. */
export const SUFIJO = `E2E-${Date.now().toString(36)}`;
