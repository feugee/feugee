import { describe, expect, it, vi } from "vitest";

const accountId = "b374b36817deffd929433cde176d1439"

const baseEnv = {
  DATABASE_URL: "postgres://feugee:feugee@localhost:5432/feugee",
  PAYLOAD_SECRET: "0123456789abcdef0123456789abcdef",
  NEXT_PUBLIC_SERVER_URL: "http://localhost:3000",
  R2_BUCKET: "feugee",
  R2_ACCESS_KEY_ID: "test-key-id",
  R2_SECRET_ACCESS_KEY: "test-secret",
  SMTP_HOST: "localhost",
  SMTP_PORT: 1025,
  EMAIL_FROM_ADDRESS: "feugee@feugee.test",
  EMAIL_FROM_NAME: "Feugee",
}

const localDevEnv = {
  ...baseEnv,
  R2_ENDPOINT: "https://nos.wjv-1.neo.id",
}

const productionEnv = {
  ...baseEnv,
  R2_ACCOUNT_ID: accountId,
  R2_PUBLIC_URL: "https://assets.feugee.com",
}

// env.ts parses process.env at import time — stub a valid local-dev baseline
// before the dynamic import below runs.
for (const [key, value] of Object.entries(localDevEnv)) {
  vi.stubEnv(key, String(value))
}

const { envSchema } = await import("./env")
const { r2StorageOptions } = await import("./storage")

describe("envSchema", () => {
  it("accepts the local-dev shape: R2_ENDPOINT set, R2_ACCOUNT_ID unset", () => {
    expect(envSchema.safeParse(localDevEnv).success).toBe(true)
  })

  it("accepts the production shape: R2_ACCOUNT_ID set, R2_ENDPOINT unset", () => {
    expect(envSchema.safeParse(productionEnv).success).toBe(true)
  })

  it("rejects both R2_ENDPOINT and R2_ACCOUNT_ID set — the provider would be ambiguous", () => {
    const result = envSchema.safeParse({
      ...localDevEnv,
      R2_ACCOUNT_ID: accountId,
    })
    expect(result.success).toBe(false)
  })

  it("rejects neither R2_ENDPOINT nor R2_ACCOUNT_ID set", () => {
    const result = envSchema.safeParse(baseEnv)
    expect(result.success).toBe(false)
  })

  it("rejects an HTTP public asset URL in production", () => {
    const result = envSchema.safeParse({
      ...productionEnv,
      R2_PUBLIC_URL: "http://assets.feugee.com",
    })

    expect(result.success).toBe(false)
  })
})

describe("r2StorageOptions", () => {
  it("uses the S3-compatible endpoint and a fixed signing region for local dev", () => {
    const options = r2StorageOptions(envSchema.parse(localDevEnv))

    expect(options.config.endpoint).toBe("https://nos.wjv-1.neo.id")
    expect(options.config.region).toBe("us-east-1")
  })

  it("derives the R2 endpoint from the account id and signs with region auto in production", () => {
    const options = r2StorageOptions(envSchema.parse(productionEnv))

    expect(options.config.endpoint).toBe(
      `https://${accountId}.r2.cloudflarestorage.com`,
    )
    expect(options.config.region).toBe("auto")
  })

  it("passes the bucket and credentials through and uploads as public-read", () => {
    const options = r2StorageOptions(envSchema.parse(localDevEnv))

    expect(options.bucket).toBe("feugee")
    expect(options.acl).toBe("public-read")
    expect(options.config.credentials).toEqual({
      accessKeyId: "test-key-id",
      secretAccessKey: "test-secret",
    })
  })
})

describe("r2PublicAssetUrlOf", () => {
  it("uses the public custom domain and preserves object-key segments", async () => {
    const { r2PublicAssetUrlOf } = await import("./storage")

    expect(
      r2PublicAssetUrlOf(
        envSchema.parse(productionEnv),
        "hero image.webp",
        "assets/abc123",
      ),
    ).toBe("https://assets.feugee.com/assets/abc123/hero%20image.webp")
  })

  it("falls back to the Payload file route for local development", async () => {
    const { r2PublicAssetUrlOf } = await import("./storage")

    expect(
      r2PublicAssetUrlOf(envSchema.parse(localDevEnv), "hero.mp4"),
    ).toBe("http://localhost:3000/api/assets/file/hero.mp4")
  })
})
