import { postgresAdapter } from "@payloadcms/db-postgres";
import { s3Storage } from "@payloadcms/storage-s3";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { seoPlugin } from "@payloadcms/plugin-seo";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";

import { Assets } from "./collections/Assets";
import { Badges } from "./collections/Badges";
import { Clients } from "./collections/Clients";
import { Sectors } from "./collections/Sectors";
import { Users } from "./collections/Users";
import { Works } from "./collections/Works";
import { emailAdapterOf } from "./email";
import { env } from "./env";
import { healthEndpoint } from "./health";
import { Footer } from "./globals/Footer";
import { LandingPage } from "./globals/LandingPage";
import { SEO } from "./globals/SEO";
import { r2PublicAssetUrlOf, r2StorageOptions } from "./storage";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  serverURL: env.NEXT_PUBLIC_SERVER_URL,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    theme: "light",
  },
  collections: [Works, Sectors, Badges, Assets, Clients, Users],
  globals: [LandingPage, Footer, SEO],
  editor: lexicalEditor(),
  // Served at /api/health — the platform readiness probe.
  endpoints: [healthEndpoint],
  secret: env.PAYLOAD_SECRET,
  email: emailAdapterOf(env),
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URL,
    },
  }),
  sharp,
  plugins: [
    s3Storage({
      collections: {
        assets: {
          generateFileURL: ({ filename, prefix }) =>
            r2PublicAssetUrlOf(env, filename, prefix),
        },
      },
      ...r2StorageOptions(env),
    }),
    seoPlugin({
      // The SEO global composes the plugin's fields itself — its two pages
      // would otherwise share one `meta` group. Works takes the standard
      // injection. Empty Work fields fall back to the Work's own face (see
      // src/seo); the generate buttons prefill from exactly those faces.
      collections: ["works"],
      uploadsCollection: "assets",
      generateTitle: ({ doc }) => {
        const title = typeof doc?.title === "string" ? doc.title.trim() : "";
        return title === "" ? "Feugee" : `${title} — Feugee`;
      },
      generateDescription: ({ doc }) =>
        typeof doc?.subtitle === "string" ? doc.subtitle : "",
      generateImage: ({ doc }) => {
        // The Thumbnail's still face: the upload Asset itself, a video's
        // Poster, or the embed's ingested poster — whichever side of the
        // either/or holds it.
        const source = doc?.thumbnail;
        if (source == null || typeof source !== "object") return "";
        const asset = source.source === "embed" ? source.embed?.poster : source.asset;
        if (typeof asset === "object" && asset !== null) {
          if (asset.mimeType?.startsWith("video/")) {
            const poster = asset.poster;
            if (typeof poster === "object" && poster !== null) return poster.id;
            return typeof poster === "number" ? poster : "";
          }
          return asset.id;
        }
        return typeof asset === "number" ? asset : "";
      },
      generateURL: ({ doc }) =>
        typeof doc?.slug === "string" && doc.slug !== ""
          ? `${env.NEXT_PUBLIC_SERVER_URL}/works/${doc.slug}`
          : "",
    }),
  ],
});
