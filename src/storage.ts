import type { S3StorageOptions } from "@payloadcms/storage-s3";

import type { Env } from "./env";

type R2StorageOptions = Omit<S3StorageOptions, "collections">;

/**
 * The S3 endpoint the credentials point at: the explicit S3-compatible
 * override (local dev's Biznet Gio, via R2_ENDPOINT) or the derived R2 one.
 */
export const r2EndpointOf = (env: Env): string =>
  env.R2_ENDPOINT ?? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

export const r2PublicAssetUrlOf = (
  env: Env,
  filename: string,
  prefix = "",
): string => {
  const baseUrl =
    env.R2_PUBLIC_URL ?? `${env.NEXT_PUBLIC_SERVER_URL}/api/assets/file`;
  const path = [prefix, filename]
    .filter(Boolean)
    .flatMap((segment) => segment.split("/"))
    .map(encodeURIComponent)
    .join("/");

  return `${baseUrl.replace(/\/$/, "")}/${path}`;
};

export function r2StorageOptions(env: Env): R2StorageOptions {
  const s3CompatibleOverride = Boolean(env.R2_ENDPOINT);

  return {
    bucket: env.R2_BUCKET,
    // Keep objects anonymously fetchable at the bucket URL (debugging, a
    // future move to direct serving). R2 ignores S3 object ACLs — public
    // serving there is bucket-level, decided alongside signedDownloads at
    // production wiring; see docs/adr/0002.
    acl: "public-read",
    config: {
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
      endpoint: r2EndpointOf(env),
      // S3-compatible clusters sign against a fixed region; R2 requires its
      // "auto" pseudo-region.
      region: s3CompatibleOverride ? "us-east-1" : "auto",
    },
  };
}
