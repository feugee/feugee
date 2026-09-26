import { z } from "zod";

export const envSchema = z
  .object({
    DATABASE_URL: z.url(),
    PAYLOAD_SECRET: z.string().min(32),
    NEXT_PUBLIC_SERVER_URL: z.url(),
    R2_BUCKET: z.string().min(1),
    R2_ACCESS_KEY_ID: z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),
    // Production fills R2_ACCOUNT_ID and the endpoint is derived from it;
    // local dev points the same credentials at an S3-compatible cluster
    // (Biznet Gio Neo) via R2_ENDPOINT instead — see docs/adr/0002.
    R2_ACCOUNT_ID: z.string().min(1).optional(),
    R2_ENDPOINT: z.url().optional(),
    R2_PUBLIC_URL: z.url().optional(),
    // Email transport — exactly one provider: any SMTP server (SMTP_*) or
    // Resend (RESEND_API_KEY). The Agency's call; local dev points SMTP at
    // Mailpit. See docs/adr/0009.
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASS: z.string().min(1).optional(),
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM_ADDRESS: z.email(),
    EMAIL_FROM_NAME: z.string().min(1),
  })
  .refine(
    ({ R2_ACCOUNT_ID, R2_ENDPOINT }) =>
      Boolean(R2_ACCOUNT_ID) !== Boolean(R2_ENDPOINT),
    {
      message:
        "Set exactly one of R2_ACCOUNT_ID (production R2) or R2_ENDPOINT (S3-compatible override)",
    },
  )
  .refine(
    ({ R2_ACCOUNT_ID, R2_PUBLIC_URL }) =>
      !R2_ACCOUNT_ID ||
      (Boolean(R2_PUBLIC_URL) && R2_PUBLIC_URL?.startsWith("https://")),
    {
      path: ["R2_PUBLIC_URL"],
      message:
        "R2_PUBLIC_URL is required and must use https:// when using production R2",
    },
  )
  .superRefine((env, ctx) => {
    if (env.NEXT_PUBLIC_SERVER_URL.endsWith("/")) {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_SERVER_URL"],
        message: "NEXT_PUBLIC_SERVER_URL must not end with a trailing slash",
      });
    }

    // `next build` also runs with NODE_ENV=production — an artifact built
    // with a local URL is harmless, so the https demand binds when the
    // built app actually starts serving (NEXT_PHASE distinguishes the two).
    const runtimeProduction =
      process.env.NODE_ENV === "production" &&
      process.env.NEXT_PHASE !== "phase-production-build";

    if (
      runtimeProduction &&
      !env.NEXT_PUBLIC_SERVER_URL.startsWith("https://")
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_SERVER_URL"],
        message: "NEXT_PUBLIC_SERVER_URL must be https:// in production",
      });
    }

    if (Boolean(env.SMTP_HOST) === Boolean(env.RESEND_API_KEY)) {
      ctx.addIssue({
        code: "custom",
        path: ["SMTP_HOST"],
        message:
          "Set exactly one of SMTP_HOST (SMTP transport) or RESEND_API_KEY (Resend)",
      });
      return;
    }

    if (env.SMTP_HOST) {
      if (!env.SMTP_PORT) {
        ctx.addIssue({
          code: "custom",
          path: ["SMTP_PORT"],
          message: "SMTP_PORT is required when SMTP_HOST is set",
        });
      }

      if (Boolean(env.SMTP_USER) !== Boolean(env.SMTP_PASS)) {
        ctx.addIssue({
          code: "custom",
          path: ["SMTP_USER"],
          message: "Set SMTP_USER and SMTP_PASS together, or neither",
        });
      }
    } else if (env.SMTP_PORT || env.SMTP_USER || env.SMTP_PASS) {
      ctx.addIssue({
        code: "custom",
        path: ["SMTP_PORT"],
        message: "SMTP_* vars are set without SMTP_HOST — remove them",
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
