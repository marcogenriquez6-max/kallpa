# ---------- Etapa 1: compila el panel interno (/sistema/) con Vite ----------
FROM node:22-alpine AS frontend
WORKDIR /app
COPY frontend/package*.json frontend/
RUN cd frontend && npm ci
COPY frontend frontend
# vite.config.ts escribe en ../landing/sistema
RUN cd frontend && npm run build

# ---------- Etapa 2: sitio público con nginx ----------
FROM nginx:alpine
COPY landing /usr/share/nginx/html
COPY --from=frontend /app/landing/sistema /usr/share/nginx/html/sistema
# envsubst reemplaza ${API_URL} al arrancar el contenedor
COPY deploy/web/nginx.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80
