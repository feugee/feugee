#!/bin/sh
# Release sequence: build (done by the image) → migrate → seed → start.
# Safe on every boot — migrations replay only pending entries, and the seed
# creates the admin only when no user exists (demo content needs SEED_DEMO).
set -e

echo "Applying database migrations"
# --force-accept-warning: an unattended deploy must never hang on the
# "database was pushed in dev mode" confirmation prompt.
npx payload migrate --force-accept-warning

echo "Seeding (admin only unless SEED_DEMO=true)"
npm run seed

echo "Starting server"
exec node .next/standalone/server.js
