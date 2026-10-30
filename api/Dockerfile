# Multi-stage Dockerfile para Ticketero API & Web Portal
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar configuraciones y dependencias
COPY api/package*.json ./api/
COPY api/tsconfig.json ./api/
COPY web/tsconfig.json ./web/

WORKDIR /app/api
RUN npm install

# Copiar fuentes de api y web
COPY web/ ../web/
COPY api/ ./

# Compilar clientes web y backend TypeScript
RUN npm run build:web
RUN npm run build

# Etapa de producción
FROM node:20-alpine AS runner

WORKDIR /app/api

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/api/package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/web ../web
COPY --from=builder /app/api/dist ./dist
RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "dist/server.js"]
