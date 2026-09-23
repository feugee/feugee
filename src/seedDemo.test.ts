import { describe, expect, it } from "vitest"

import { shouldSeedDemoContent } from "./seedDemo"

describe("shouldSeedDemoContent", () => {
  it("seeds demo content outside production, as local dev always has", () => {
    expect(shouldSeedDemoContent({ NODE_ENV: "development" })).toBe(true)
    expect(shouldSeedDemoContent({})).toBe(true)
  })

  it("seeds nothing beyond the admin in production unless explicitly asked", () => {
    expect(shouldSeedDemoContent({ NODE_ENV: "production" })).toBe(false)
  })

  it("honours SEED_DEMO in production when set to true or 1", () => {
    expect(shouldSeedDemoContent({ NODE_ENV: "production", SEED_DEMO: "true" })).toBe(true)
    expect(shouldSeedDemoContent({ NODE_ENV: "production", SEED_DEMO: "1" })).toBe(true)
  })

  it("treats any other SEED_DEMO value as absent", () => {
    expect(shouldSeedDemoContent({ NODE_ENV: "production", SEED_DEMO: "false" })).toBe(false)
    expect(shouldSeedDemoContent({ NODE_ENV: "production", SEED_DEMO: "yes" })).toBe(false)
  })

  it("never lets SEED_DEMO be required outside production", () => {
    expect(shouldSeedDemoContent({ NODE_ENV: "development", SEED_DEMO: "false" })).toBe(true)
  })
})
