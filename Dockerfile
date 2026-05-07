# ── Builder ──────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG NEXT_PUBLIC_API_BASE
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV UPSTREAM_API_URL=https://captain.sapimu.au

RUN npm run build

# ── Runtime ──────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup --system app && adduser --system --ingroup app app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN chown -R app:app .next

USER app

ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV UPSTREAM_API_URL=https://captain.sapimu.au

EXPOSE 3000

CMD ["node", "server.js"]
