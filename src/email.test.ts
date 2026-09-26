import { afterEach, describe, expect, it, vi } from "vitest";

const baseEnv = {
  DATABASE_URL: "postgres://feugee:feugee@localhost:5432/feugee",
  PAYLOAD_SECRET: "0123456789abcdef0123456789abcdef",
  NEXT_PUBLIC_SERVER_URL: "http://localhost:3000",
  R2_BUCKET: "feugee",
  R2_ACCESS_KEY_ID: "test-key-id",
  R2_SECRET_ACCESS_KEY: "test-secret",
  R2_ENDPOINT: "https://nos.wjv-1.neo.id",
  EMAIL_FROM_ADDRESS: "feugee@feugee.test",
  EMAIL_FROM_NAME: "Feugee",
};

const smtpEnv = {
  ...baseEnv,
  SMTP_HOST: "localhost",
  SMTP_PORT: 1025,
};

const smtpAuthEnv = {
  ...smtpEnv,
  SMTP_USER: "mailer",
  SMTP_PASS: "mailer-secret",
};

const resendEnv = {
  ...baseEnv,
  RESEND_API_KEY: "re_test_key",
};

// env.ts parses process.env at import time — stub a valid local-dev baseline
// (SMTP against Mailpit) before the dynamic import below runs.
for (const [key, value] of Object.entries(smtpEnv)) {
  vi.stubEnv(key, String(value));
}

const { envSchema } = await import("./env");
const { emailProviderOf, nodemailerArgsOf, resendArgsOf } =
  await import("./email");

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("envSchema — email transport", () => {
  it("accepts the SMTP shape with host and port, no credentials", () => {
    expect(envSchema.safeParse(smtpEnv).success).toBe(true);
  });

  it("accepts the SMTP shape with credentials", () => {
    expect(envSchema.safeParse(smtpAuthEnv).success).toBe(true);
  });

  it("accepts the Resend shape", () => {
    expect(envSchema.safeParse(resendEnv).success).toBe(true);
  });

  it("rejects SMTP and Resend set together — the provider would be ambiguous", () => {
    const result = envSchema.safeParse({
      ...smtpEnv,
      RESEND_API_KEY: "re_test_key",
    });
    expect(result.success).toBe(false);
  });

  it("rejects neither SMTP nor Resend set", () => {
    const result = envSchema.safeParse(baseEnv);
    expect(result.success).toBe(false);
  });

  it("rejects SMTP_HOST without SMTP_PORT — the port must be explicit", () => {
    const result = envSchema.safeParse({ ...baseEnv, SMTP_HOST: "localhost" });
    expect(result.success).toBe(false);
  });

  it("rejects SMTP_USER without SMTP_PASS and vice versa", () => {
    expect(
      envSchema.safeParse({ ...smtpEnv, SMTP_USER: "mailer" }).success,
    ).toBe(false);
    expect(
      envSchema.safeParse({ ...smtpEnv, SMTP_PASS: "mailer-secret" }).success,
    ).toBe(false);
  });

  it("rejects stray SMTP_* vars left behind when Resend is the provider", () => {
    const result = envSchema.safeParse({ ...resendEnv, SMTP_PORT: 1025 });
    expect(result.success).toBe(false);
  });
});

describe("envSchema — NEXT_PUBLIC_SERVER_URL", () => {
  it("accepts an http localhost URL outside production", () => {
    expect(envSchema.safeParse(smtpEnv).success).toBe(true);
  });

  it("rejects a value that is not a URL", () => {
    const result = envSchema.safeParse({
      ...smtpEnv,
      NEXT_PUBLIC_SERVER_URL: "not a url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a trailing slash — reset links would carry doubled separators", () => {
    const result = envSchema.safeParse({
      ...smtpEnv,
      NEXT_PUBLIC_SERVER_URL: "http://localhost:3000/",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an http URL when NODE_ENV is production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const result = envSchema.safeParse(smtpEnv);
    expect(result.success).toBe(false);
  });

  it("accepts an https URL when NODE_ENV is production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const result = envSchema.safeParse({
      ...smtpEnv,
      NEXT_PUBLIC_SERVER_URL: "https://feugee.example.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an http URL during a production build — the rule binds when the app serves", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    expect(envSchema.safeParse(smtpEnv).success).toBe(true);
  });
});

describe("emailProviderOf", () => {
  it("picks SMTP when SMTP_HOST is set", () => {
    expect(emailProviderOf(envSchema.parse(smtpAuthEnv))).toBe("smtp");
  });

  it("picks Resend when only RESEND_API_KEY is set", () => {
    expect(emailProviderOf(envSchema.parse(resendEnv))).toBe("resend");
  });
});

describe("nodemailerArgsOf", () => {
  it("points the transport at host and port with no auth for the Mailpit shape", () => {
    const args = nodemailerArgsOf(envSchema.parse(smtpEnv));

    expect(args.defaultFromAddress).toBe("feugee@feugee.test");
    expect(args.defaultFromName).toBe("Feugee");
    expect(args.transportOptions).toEqual({
      host: "localhost",
      port: 1025,
    });
  });

  it("passes credentials through when both are set", () => {
    const args = nodemailerArgsOf(envSchema.parse(smtpAuthEnv));

    expect(args.transportOptions).toMatchObject({
      host: "localhost",
      port: 1025,
      auth: { user: "mailer", pass: "mailer-secret" },
    });
  });

  it("throws when given the Resend env shape", () => {
    expect(() => nodemailerArgsOf(envSchema.parse(resendEnv))).toThrow();
  });
});

describe("resendArgsOf", () => {
  it("carries the API key and the from identity", () => {
    const args = resendArgsOf(envSchema.parse(resendEnv));

    expect(args).toEqual({
      apiKey: "re_test_key",
      defaultFromAddress: "feugee@feugee.test",
      defaultFromName: "Feugee",
    });
  });

  it("throws when given the SMTP env shape", () => {
    expect(() => resendArgsOf(envSchema.parse(smtpEnv))).toThrow();
  });
});
