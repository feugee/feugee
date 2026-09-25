# Asset storage on Cloudflare R2

The agency will upload many large video and image Assets. Production runs on a single Coolify-managed VPS, where serving heavy video from local disk would strain bandwidth and storage. Assets are stored on Cloudflare R2 (S3-compatible) via Payload's S3 storage adapter, even though the app itself is otherwise self-hosted on the VPS.

## Consequences

- Asset URLs point at R2 and get baked into published content — swapping storage providers later means rewriting those references.
- R2 credentials and a bucket are required before the first upload feature; the storage adapter stays unwired until they exist.

## Amendment — 2026-09-16: wired via S3 adapter, Biznet Gio for local dev

The adapter is wired (`src/storage.ts` builds the options, spread into `s3Storage` in `payload.config.ts`). Local development does not use R2: the same `R2_*` credentials point at Biznet Gio Neo Object Storage (`https://nos.wjv-1.neo.id`) through `R2_ENDPOINT`; production sets `R2_ACCOUNT_ID` instead and the R2 endpoint is derived from it. The env schema enforces exactly one of the two. Production CMS data starts from scratch, so nothing carries over between providers.

Two consequences above turned out different once wired:

- URLs the CMS stores are app-relative (`/api/assets/file/<filename>`), not provider URLs — the plugin streams objects through the app by default. Swapping providers later does not rewrite content references after all; only absolute URLs pasted into rich text would break.
- Because objects stream through the app, heavy video still consumes VPS bandwidth — the original strain concern is half-solved (storage offloaded, bandwidth not). Direct serving is available via the plugin's `signedDownloads` (302 to presigned URLs, expiring); whether production wants that is deferred to the production R2 wiring. Uploads also set a public-read object ACL — honored by Biznet Gio, ignored by R2 (public access there is bucket-level); revisit alongside `signedDownloads` when wiring production.

## Amendment — 2026-09-25: public custom-domain delivery

Production uses a public R2 custom domain, supplied as `R2_PUBLIC_URL`, for anonymous Asset delivery. The S3 API endpoint remains private to the server and continues to handle uploads, deletes, and fallback reads. Payload's `generateFileURL` hook builds URLs from the stored object key, including generated image-size variants, so public pages never expose the R2 S3 endpoint.

The Cloudflare dashboard must attach the custom domain to the bucket, enable public bucket access for that domain, and apply `Cache-Control: public, max-age=31536000, immutable` to the asset path. The application applies the same immutable header to its fallback `/api/assets/file/*` responses. Local development omits `R2_PUBLIC_URL` and keeps using the Payload route.

This chooses public delivery over signed downloads because public Assets are embedded in anonymous pages and include large videos. The trade-off is that anyone with an Asset URL can fetch it; the custom domain and immutable caching remove VPS bandwidth from normal public traffic while retaining the app route for local development and operational fallback.
