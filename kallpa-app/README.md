# KALLPA — Sistema de Gestión

Sistema de control de contratos, insumos, compras, producción y finanzas de
**KALLPA — Eventos y Alta Cocina** (Oruro, Bolivia).

## Estado: v0.1 — Fase 1, esqueleto del backend

| Componente | Estado |
|---|---|
| Modelo de datos (26 tablas) | Listo |
| Autenticación, roles y bitácora de auditoría | Listo |
| Usuarios (administración por la gerente) | Listo |
| Parámetros de negocio editables | Listo |
| Datos iniciales: unidades, categorías, insumos, catálogo, socios | Listo |
| Catálogo y fichas técnicas (API) | Siguiente |
| Contratos, explosión de insumos, compras, producción, liquidación | Pendiente |
| Sitio público (landing en `landing/`) | Listo, sin conexión a la API |
| Frontend interno (React PWA) | Pendiente |

## Tecnología

- **Backend:** NestJS 11 · TypeScript · Prisma 7 · PostgreSQL 17
- **Frontend (próximo):** React · Vite · Tailwind, como aplicación web instalable (PWA)
- **Despliegue:** Docker Compose

## Puesta en marcha

### Opción A: todo con Docker (recomendada)

```bash
cp .env.example .env            # edite DB_PASSWORD, JWT_SECRET y SEED_PASSWORD
docker compose up -d --build    # crea la base, aplica migraciones y arranca la API
docker compose exec api npx prisma db seed   # datos iniciales (una sola vez)
curl http://localhost:3000/api/salud
```

El sitio público queda en http://localhost:8080 (servicio `web`).

Antes del primer `docker compose up` debe existir la migración inicial
(ver opción B, paso `migrate dev`).

### Opción B: desarrollo local

Requiere Node.js 22 o superior y PostgreSQL.

```bash
cd backend
cp .env.example .env            # ajuste DATABASE_URL y JWT_SECRET
npm install                     # también genera el cliente de Prisma
npx prisma migrate dev --name inicial   # crea las tablas y la migración inicial
npx prisma db seed
npm run start:dev
```

La carpeta `backend/prisma/migrations` que crea `migrate dev` debe guardarse en
el repositorio: es la que Docker aplica en producción con `migrate deploy`.

## Roles

| Rol | Persona(s) | Alcance |
|---|---|---|
| `GERENTE` | Maribel Pantoja | Contratos, finanzas, usuarios, parámetros, bitácora |
| `GERENTE_GASTRONOMICO` | Percy Irahola | Catálogo, fichas técnicas, solicitudes de insumos |
| `LOGISTICA` | Victor, Alex, Paola, Marina | Compras, proveedores, entrega en cocina |
| `COCINA` | Personal de cocina | Producción, control de temperaturas, recepción |
| `CONSULTA` | Socio en lectura | Solo consulta |

Usuarios iniciales: `maribel@`, `percy@`, `victor@`, `alex@`, `paola@` y
`marina@kallpa.bo`, con la contraseña de `SEED_PASSWORD`. **Los correos son
provisionales** y cada usuario debe cambiar su contraseña en el primer ingreso.

## API disponible

Todas las rutas usan el prefijo `/api` y requieren `Authorization: Bearer <token>`,
salvo las públicas.

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/salud` | Pública |
| POST | `/auth/login` | Pública |
| GET | `/auth/perfil` | Cualquier usuario |
| POST | `/auth/cambiar-password` | Cualquier usuario |
| GET / POST | `/usuarios` | Gerente |
| PATCH | `/usuarios/:id` | Gerente |
| POST | `/usuarios/:id/restablecer-password` | Gerente |
| GET | `/parametros` | Cualquier usuario |
| PATCH | `/parametros/:clave` | Gerente |
| GET | `/bitacora?entidad=&entidadId=` | Gerente, Consulta |

## Estructura

```
kallpa-app/
├── docker-compose.yml
├── .env.example
├── landing/
│   └── index.html           # sitio público (HTML único, sin build)
└── backend/
    ├── prisma/
    │   ├── schema.prisma        # modelo de datos
    │   └── seed.ts              # datos iniciales
    ├── prisma.config.ts
    └── src/
        ├── main.ts
        ├── app.module.ts
        ├── auth/                # login, token, guardias de sesión y rol
        ├── usuarios/
        ├── parametros/          # parametros.definicion.ts = reglas de negocio
        ├── bitacora/            # auditoría de solo inserción
        ├── salud/
        ├── prisma/
        └── common/
```

## Convenciones

- Código y mensajes en español, con el vocabulario del negocio.
- Cada módulo de negocio es un módulo de NestJS independiente.
- Todo cambio de estado o dato sensible se registra en la bitácora, en la misma
  transacción que el cambio.
- Montos y cantidades se guardan como `Decimal`, nunca como coma flotante.
- Tarifas y reglas se leen de `Parametro`; no se escriben en el código.

## Sitio público (`landing/`)

Página de presentación y cotización de KALLPA. Es un solo `index.html`, sin
dependencias ni paso de compilación; se sirve con nginx (`docker compose up web`)
o se puede abrir directamente en el navegador.

Antes de publicarla, completar en `landing/index.html`:

- `NUM` (al final del archivo): WhatsApp de Kallpa en formato internacional sin
  «+», por ejemplo `59171234567`. Por ahora el formulario de cotización arma el
  mensaje y lo envía por WhatsApp; no escribe en la base de datos.
- Teléfono, dirección y correo (buscar `7X XXX XXX`, `[Calle / Av., zona]` y
  `[correo de contacto]`).
- Fotos reales: los bloques de color de la portada, valores, servicios y galería
  son marcadores.
- Los cuatro «valores» (Puntualidad, Servicio personalizado, Pasión, Calidad)
  están provisionales.

Las líneas de menú de la página (Clásica, Reserva, Gran Reserva) y los tipos de
evento coinciden con `LineaCatalogo` y `TipoCliente` del modelo de datos.
