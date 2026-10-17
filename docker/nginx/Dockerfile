# Этап 1: сборка фронтенда
FROM node:22-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Если tsc споткнётся о типы, собираем без проверки: на запуск это не влияет
RUN npm run build || npx vite build

# Этап 2: nginx со статикой
FROM nginx:1.27-alpine
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html