import { getPayload } from "payload"
import { z } from "zod"

import config from "./payload.config"
import { noRevalidate, seedDemoContent, shouldSeedDemoContent } from "./seedDemo"

const payload = await getPayload({ config })

const existing = await payload.find({
  collection: "users",
  limit: 1,
})

if (existing.docs.length === 0) {
  // Validated here, not at startup: credentials are only needed for the boot
  // that actually creates the admin, not on every later run.
  const seedEnv = z
    .object({
      PAYLOAD_ADMIN_EMAIL: z.email(),
      PAYLOAD_ADMIN_PASSWORD: z.string().min(8),
    })
    .parse(process.env)

  await payload.create({
    collection: "users",
    context: noRevalidate,
    data: {
      email: seedEnv.PAYLOAD_ADMIN_EMAIL,
      password: seedEnv.PAYLOAD_ADMIN_PASSWORD,
      name: "Feugee Admin",
    },
  })
  payload.logger.info(`Seeded first admin user: ${seedEnv.PAYLOAD_ADMIN_EMAIL}`)
} else {
  payload.logger.info("A user already exists — skipping seed")
}

// The admin above is the only mandatory production content; everything else —
// demo Works, testimonials, placeholder contact details — is opt-in.
if (shouldSeedDemoContent(process.env)) {
  await seedDemoContent(payload)
} else {
  payload.logger.info(
    "Production seed: admin only — set SEED_DEMO=true to add demo content",
  )
}

process.exit(0)
