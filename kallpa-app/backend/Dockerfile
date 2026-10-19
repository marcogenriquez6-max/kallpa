# ---------- Etapa de construcción ----------
FROM node:22-alpine AS build
WORKDIR /app
# prisma.config.ts exige DATABASE_URL al cargarse (también para generate).
# En build no hay conexión real, así que basta un valor de relleno.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
COPY package*.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npx prisma generate && npm run build

# ---------- Etapa de ejecución ----------
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json /app/prisma.config.ts ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src ./src
COPY --from=build /app/dist ./dist
EXPOSE 3000
# Aplica migraciones, siembra los datos iniciales (solo si SEED_PASSWORD está
# definido; el seed es idempotente) y arranca la API.
CMD ["sh", "-c", "npx prisma migrate deploy && if [ -n \"$SEED_PASSWORD\" ]; then npx prisma db seed; fi && node dist/main.js"]
