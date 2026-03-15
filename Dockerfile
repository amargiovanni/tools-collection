FROM node:25-alpine AS builder
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

EXPOSE 80
