FROM node:26.10-trixie AS builder

WORKDIR /app

COPY package*.json .

RUN npm ci

COPY . .

ARG EXPO_PUBLIC_SUPABASE_URL
ARG EXPO_PUBLIC_SUPABASE_KEY

RUN npm run build:web

FROM nginxinc/nginx-unprivileged:stable-alpine3.24

ARG DOCROOT=/usr/share/nginx/html

USER root
COPY --from=builder --chown=nobody:nobody /app/dist/ /usr/share/nginx/html/
RUN find ${DOCROOT} -type d -print0 | xargs -0 chmod 755 && \
    find ${DOCROOT} -type f -print0 | xargs -0 chmod 644 && \
    chmod 755 ${DOCROOT}

USER nginx

HEALTHCHECK --interval=5s --timeout=3s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080 || exit 1
