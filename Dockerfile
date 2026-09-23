# syntax=docker/dockerfile:1

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Build-time env: `next build` loads the Payload config (which validates the
# whole env schema) and prerenders the public pages against the database, so
# the build needs the same env the runtime gets. Declare each var as an ARG
# and it stays out of the final image layers; the platform (Coolify) passes
# its env vars into the build automatically when the ARGs are declared here.
ARG DATABASE_URL \
    PAYLOAD_SECRET \
    NEXT_PUBLIC_SERVER_URL \
    R2_BUCKET \
    R2_ACCESS_KEY_ID \
    R2_SECRET_ACCESS_KEY \
    R2_ACCOUNT_ID \
    R2_ENDPOINT \
    SMTP_HOST \
    SMTP_PORT \
    SMTP_USER \
    SMTP_PASS \
    RESEND_API_KEY \
    EMAIL_FROM_ADDRESS \
    EMAIL_FROM_NAME
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Migrate before building: `next build` prerenders the public pages against
# the database, so the schema must exist even on a brand-new Postgres. The
# entrypoint migrates again on every boot — both steps are idempotent.
RUN npx payload migrate --force-accept-warning && npm run build

FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0

# Production deps carry the Payload CLI (tsx included) for the entrypoint's
# migrate + seed; they never mix with the standalone server's traced subset,
# which lives inside .next/standalone. --ignore-scripts skips the `prepare`
# hook (husky — a devDependency) and is safe here: sharp and esbuild ship
# their platform binaries as optional dependencies, not install scripts.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# The CLI loads the TS config from src/ and replays migrations/ — src comes
# from the builder so the generated import map is included.
COPY --from=builder /app/src ./src
COPY migrations ./migrations
COPY tsconfig.json next.config.ts ./

# Standalone server output. server.js does not copy public/ or .next/static
# itself — they go next to it inside .next/standalone.
COPY --from=builder /app/.next/standalone ./.next/standalone
COPY --from=builder /app/.next/static ./.next/standalone/.next/static
COPY --from=builder /app/public ./.next/standalone/public

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
