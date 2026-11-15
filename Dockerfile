# Etapa 1: Compilación de la aplicación
FROM docker.io/library/node:22-alpine AS builder

WORKDIR /app

# Habilitar pnpm mediante corepack
RUN corepack enable && corepack prepare pnpm@10.5.2 --activate

# Copiar archivos de dependencias y configuración de workspace de pnpm
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* .npmrc* ./

# Instalar dependencias respetando el lockfile inmutable
RUN pnpm install --frozen-lockfile

# Copiar código fuente y compilar
COPY . .
RUN pnpm build

# Etapa 2: Servidor web de producción Nginx
FROM docker.io/library/nginx:alpine AS runner

# Copiar configuración optimizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar artefactos compilados desde el builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
