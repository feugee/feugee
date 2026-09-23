# Feugee

The public website and CMS for [Feugee](https://feugee.com), a creative agency. A visitor-facing, animation-heavy site built with Next.js and GSAP, and an authenticated Payload CMS the agency uses to manage every piece of public content — Works, Assets, testimonials, footer, and the Landing Page.

- **Public site** — Landing Page (video Hero, Client Marquee, Selected Works, Testimonials), a Works listing, and rich Work Detail Pages. Pages are prerendered at build and revalidated when the CMS changes.
- **CMS Dashboard** — Payload admin at `/admin`; content shape is defined by the agency over time, and the schema is owned by the migration chain in `migrations/`.
- **Assets** — images and video uploaded through the CMS, stored on S3-compatible storage (Cloudflare R2 in production) with a generated size ladder of WebP variants. See `docs/adr/0002`.

Vocabulary for the domain lives in `CONTEXT.md`; architecture decisions in `docs/adr/`.

## Local development

```bash
cp .env.example .env   # then fill PAYLOAD_SECRET and the R2 credentials
docker compose up -d   # Postgres + Mailpit
npm install
npm run migrate        # apply the migration chain to the local database
npm run seed           # admin user + demo content (see below)
npm run dev
```

The site runs at http://localhost:3000 and the CMS Dashboard at http://localhost:3000/admin. Mail sent locally lands in Mailpit at http://localhost:8025.

### Seeding

`npm run seed` always creates the first admin user (from `PAYLOAD_ADMIN_EMAIL` / `PAYLOAD_ADMIN_PASSWORD`) when no user exists. The demo content — sample Works, testimonials, placeholder contact details — seeds automatically outside production, so local dev gets a populated site. In production it is opt-in: set `SEED_DEMO=true` for the initial seed, then remove it; subsequent runs never touch existing content.

## Database migrations

The CMS schema is owned by the migration chain in `migrations/`, never by `payload dev`'s live push. Two checks keep it honest:

- **No drift between configs and migrations**: `npx payload migrate:create` should report `No schema changes detected` (decline the blank-file prompt it offers).
- **The chain builds from zero**: before each deploy, run the one-liner below. It stands up a throwaway Postgres, replays every migration from an empty database, and runs the seed end-to-end — proving deploy order will not hit a broken or missing migration. It exits non-zero on any failure (including the container never becoming ready within 30s), never touches a same-named container it did not start, and always tears its own container down. The seed uploads its fixture Assets to the configured bucket, exactly like a local `npm run seed`.

```bash
( docker run --rm -d --name feugee-chain-check -e POSTGRES_USER=chain -e POSTGRES_PASSWORD=chain -e POSTGRES_DB=chain -p 5433:5432 postgres:18-alpine || exit 1; for i in $(seq 1 30); do docker exec feugee-chain-check pg_isready -U chain -q && ready=1 && break; sleep 1; done; [ "$ready" = 1 ] && DATABASE_URL='postgres://chain:chain@localhost:5433/chain' npm run migrate && DATABASE_URL='postgres://chain:chain@localhost:5433/chain' npm run seed; rc=$?; docker rm -f feugee-chain-check >/dev/null; exit $rc )
```

`npm run migrate:status` against the target database should likewise show every migration as ran before a deploy ships.

## Release runbook

A release is **build → migrate → seed → start**, executed by the container image on every boot.

### The image

The `Dockerfile` builds a standalone-output image: `next build` traces the minimal server into `.next/standalone`, and the container serves `node server.js` (with `public/` and `.next/static` copied in beside it). A production `node_modules` rides along in the image so the entrypoint (`docker-entrypoint.sh`) can run, on every boot:

1. **migrate** — `npx payload migrate --force-accept-warning`, applying only pending migrations (the flag keeps an unattended boot from ever blocking on a confirmation prompt)
2. **seed** — `npm run seed`, admin-only in production unless `SEED_DEMO=true`
3. **start** — `node .next/standalone/server.js`

A `HEALTHCHECK` probes `/api/health`, which answers 200 only once the app can query its database — point the platform's readiness probe at the same path.

### Building the image

`next build` loads the Payload config (which validates the entire env schema via `src/env.ts`) and prerenders the public pages against the database. The build stage therefore needs the same environment the runtime gets — declared as `ARG`s in the Dockerfile, which keeps the values out of the *final* image's layers (they do remain visible in the builder-stage history and build logs, so treat build logs as sensitive). The build also runs `payload migrate` first, so the schema exists even on a brand-new Postgres. Concretely: the database must be reachable, and `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL` (the production URL — it is inlined into the client bundle at build time), the `R2_*`, email, and `EMAIL_FROM_*` variables must all be present at build time.

```bash
docker build \
  --build-arg DATABASE_URL=postgres://… \
  --build-arg NEXT_PUBLIC_SERVER_URL=https://feugee.com \
  --build-arg PAYLOAD_SECRET=… \
  … \
  -t feugee:latest .
```

### Deploying on Coolify (VPS)

The app runs as a Dockerfile deployment next to a Postgres service, both on one server (sizing notes in issue #2):

1. **Postgres first** — add Coolify's PostgreSQL service; the first app build migrates it, so it must be reachable (empty is fine). Note its internal connection URL.
2. **Create the app** from the repository, build type Dockerfile. Coolify passes its environment variables into the build when the Dockerfile declares them as `ARG`s — the full runtime env from `.env.example` (minus `SEED_DEMO`) must be set, with `DATABASE_URL` pointing at the Postgres service.
3. **First release** — set `SEED_DEMO=true`, `PAYLOAD_ADMIN_EMAIL`, and `PAYLOAD_ADMIN_PASSWORD` for the initial deploy so the admin account is created along with the demo content; remove all three afterwards. The admin credentials are only read on a boot that actually creates the admin.
4. **Domain + HTTPS** — attach the domain in Coolify; its proxy handles certificates. `NEXT_PUBLIC_SERVER_URL` must match it exactly.
5. **Health check** — set Coolify's health-check path to `/api/health`.
6. **Subsequent deploys** — push to the branch Coolify watches; each boot re-runs migrate → seed → start, both idempotent.
