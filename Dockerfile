FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
WORKDIR /usr/share/nginx/html

RUN rm -rf ./* \
  && mkdir -p /usr/share/nginx/html/data

COPY --from=builder /app/dist/ ./
COPY docker/default-language.sh /docker-entrypoint.d/40-default-language.sh

RUN chmod +x /docker-entrypoint.d/40-default-language.sh

EXPOSE 80
