# Kallpa — Sistema de gestión

Sistema de control de contratos, insumos, compras, producción y finanzas de
**KALLPA — Eventos y Alta Cocina** (Oruro, Bolivia).

- Aplicación (backend NestJS + frontend React + landing): [`kallpa-app/`](kallpa-app/)
- Documentación del proyecto: [`kallpa-app/README.md`](kallpa-app/README.md)

## Despliegue en Render (plan gratis)

El repositorio incluye `render.yaml` (en la raíz) con dos servicios Docker:

| Servicio | Contenido | URL |
|---|---|---|
| `kallpa-web` | Landing + panel `/sistema/` (nginx) | https://kallpa-web.onrender.com |
| `kallpa-api` | API NestJS | https://kallpa-api.onrender.com |

La base de datos vive en **Supabase** (Postgres gratis).

1. Crear un proyecto en https://supabase.com y copiar la cadena de conexión:
   *Connect → Session pooler → URI* (puerto 5432, agregar `?sslmode=require`).
2. En https://render.com: **New → Blueprint**, conectar el repositorio y aplicar.
   Completar `DATABASE_URL` y `SEED_PASSWORD` cuando lo pida.
3. Al arrancar, la API aplica las migraciones (`prisma migrate deploy`) y siembra
   los datos iniciales (`prisma db seed`, idempotente) si `SEED_PASSWORD` está definida.

Plan gratis: los servicios se suspenden a los 15 minutos sin tráfico (el primer
acceso tarda cerca de un minuto) y Supabase pausa el proyecto tras 7 días sin uso.
