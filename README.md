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

### CI-built image (GitHub Actions)

Building on the VPS is optional. Pushing to `main` triggers [the build workflow](.github/workflows/build-image.yml): an Actions runner (7 GB RAM — far beyond the target VPS) builds the image against a throwaway Postgres service and publishes it to `ghcr.io/feugee/feugee` (tags: `latest` + commit SHA). The workflow needs the same build-time env as GitHub secrets/variables; `DATABASE_URL` is generated in-workflow, pointing at the throwaway database through the runner's bridge gateway. Pages prerender against that empty database — harmless, because the runtime seed writes through the Payload Local API, firing the revalidation hooks that repopulate the served pages on first boot.

This is the recommended release path on a small VPS: Coolify deploys `ghcr.io/feugee/feugee:latest` directly and never runs `next build` on the server.

### Deploying on Coolify (VPS)

The app runs as a Docker image deployment next to a Postgres service, both on one server (sizing notes in issue #2):

1. **Postgres first** — add Coolify's PostgreSQL service; the app's entrypoint migrates and seeds it on every boot, so it must exist and be reachable (empty is fine). Note its internal connection URL.
2. **Create the app** — preferred: deploy the CI-built image `ghcr.io/feugee/feugee:latest` (Docker-image resource; publish the GHCR package or configure pull credentials). Alternatively, build from the repository with build type Dockerfile — Coolify passes its environment variables into the build when the Dockerfile declares them as `ARG`s. Either way, the full runtime env from `.env.example` (minus `SEED_DEMO`) must be set, with `DATABASE_URL` pointing at the Postgres service.
3. **First release** — set `SEED_DEMO=true`, `PAYLOAD_ADMIN_EMAIL`, and `PAYLOAD_ADMIN_PASSWORD` for the initial deploy so the admin account is created along with the demo content; remove all three afterwards. The admin credentials are only read on a boot that actually creates the admin.
4. **Domain + HTTPS** — attach the domain in Coolify; its proxy handles certificates. `NEXT_PUBLIC_SERVER_URL` must match it exactly.
5. **Health check** — set Coolify's health-check path to `/api/health`.
6. **Subsequent deploys** — push to the branch Coolify watches; each boot re-runs migrate → seed → start, both idempotent.

### Safe production release checklist

Before the first public-R2 release, create the R2 custom domain in Cloudflare and configure the bucket for public reads. Set `R2_PUBLIC_URL=https://assets.example.com` in both Coolify's runtime environment and the GitHub repository variable used by the image workflow. Keep `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY` in the appropriate GitHub secrets and Coolify environment fields; never commit them.

Existing assets in the same R2 bucket are reused. The application does not copy or re-upload them: Payload regenerates their public URLs from the stored `_objectKey`, and generated image-size variants keep their existing object keys. Verify one original, one image variant, and one video URL after deployment. If the existing assets are in a different provider or bucket, copy the objects while preserving their keys before switching `R2_PUBLIC_URL`; do not delete the old storage until verification is complete.

For a new Payload field, generate and commit its migration locally with `npm run migrate:create`, review both the migration code and its JSON snapshot, and deploy the migration with the application. The container runs `payload migrate --force-accept-warning` before starting, applying only pending migrations. Take a Postgres backup or snapshot before the release, and never use `payload migrate:fresh`, `payload migrate:reset`, or a destructive manual schema push against production.

Pushing to `main` starts `.github/workflows/build-image.yml`. GitHub builds the image against a temporary Postgres database and publishes `ghcr.io/feugee/feugee:latest` plus a commit tag; it does not change the production database. Coolify must be configured to redeploy that image when `latest` changes, or you must trigger a redeploy manually. On the new container, the entrypoint applies pending migrations, runs the idempotent seed, and starts the server. A failed build or health check leaves the previous running release untouched; inspect the migration and application logs before retrying.
