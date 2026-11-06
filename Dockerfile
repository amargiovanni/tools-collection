FROM node:26-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
WORKDIR /usr/share/nginx/html

RUN rm -rf ./* \
  && mkdir -p /usr/share/nginx/html/data

# Hardening (CVE-2025-60876, busybox wget CRLF injection — no Alpine fix yet):
# the image only serves static files and nothing in it uses wget, so drop the
# wget applet and the ssl_client helper it uses for HTTPS. The build fails if
# either comes back. Scanners still report the busybox package by version.
RUN rm -f /usr/bin/wget /usr/bin/ssl_client \
  && if command -v wget >/dev/null 2>&1 || [ -e /usr/bin/ssl_client ]; then \
       echo "wget/ssl_client still present" >&2; exit 1; \
     fi

COPY --from=builder /app/dist/ ./
COPY docker/security-headers.conf /etc/nginx/conf.d/default.conf
COPY docker/default-language.sh /docker-entrypoint.d/40-default-language.sh

RUN chmod +x /docker-entrypoint.d/40-default-language.sh

EXPOSE 80
