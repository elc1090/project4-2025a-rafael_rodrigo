# Etapa 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copia os arquivos de dependência e instala antes (cache esperto)
COPY package.json package-lock.json ./
RUN npm ci

# Copia o resto do app e builda
COPY . ./
RUN npm run build

# Etapa 2: Serve com nginx
FROM nginx:stable-alpine

# Copia o build para o nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Remove a config default e põe uma custom (opcional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expondo a porta padrão do nginx
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

