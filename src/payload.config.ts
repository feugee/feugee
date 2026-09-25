import { postgresAdapter } from "@payloadcms/db-postgres";
import { s3Storage } from "@payloadcms/storage-s3";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";

import { Assets } from "./collections/Assets";
import { Clients } from "./collections/Clients";
import { Sectors } from "./collections/Sectors";
import { Users } from "./collections/Users";
import { Works } from "./collections/Works";
import { emailAdapterOf } from "./email";
import { env } from "./env";
import { healthEndpoint } from "./health";
import { Footer } from "./globals/Footer";
import { LandingPage } from "./globals/LandingPage";
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
  collections: [Works, Sectors, Assets, Clients, Users],
  globals: [LandingPage, Footer],
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
  ],
});
