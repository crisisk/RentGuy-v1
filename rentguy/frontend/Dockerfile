# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./ 2>/dev/null || true
COPY . .
RUN npm ci || npm i
RUN npm run build

# Serve stage
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY --from=builder /app/dist .
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.d/40-rewrite-api-url.sh
RUN chmod +x /docker-entrypoint.d/40-rewrite-api-url.sh
EXPOSE 80
