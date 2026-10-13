import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_seo_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__seo_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "seo" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"landing_page_title" varchar,
  	"landing_page_description" varchar,
  	"landing_page_image_id" integer,
  	"works_page_title" varchar,
  	"works_page_description" varchar,
  	"works_page_image_id" integer,
  	"share_image_id" integer,
  	"_status" "enum_seo_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_seo_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_landing_page_title" varchar,
  	"version_landing_page_description" varchar,
  	"version_landing_page_image_id" integer,
  	"version_works_page_title" varchar,
  	"version_works_page_description" varchar,
  	"version_works_page_image_id" integer,
  	"version_share_image_id" integer,
  	"version__status" "enum__seo_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  ALTER TABLE "works" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "works" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "works" ADD COLUMN "meta_image_id" integer;
  ALTER TABLE "_works_v" ADD COLUMN "version_meta_title" varchar;
  ALTER TABLE "_works_v" ADD COLUMN "version_meta_description" varchar;
  ALTER TABLE "_works_v" ADD COLUMN "version_meta_image_id" integer;
  ALTER TABLE "seo" ADD CONSTRAINT "seo_landing_page_image_id_assets_id_fk" FOREIGN KEY ("landing_page_image_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "seo" ADD CONSTRAINT "seo_works_page_image_id_assets_id_fk" FOREIGN KEY ("works_page_image_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "seo" ADD CONSTRAINT "seo_share_image_id_assets_id_fk" FOREIGN KEY ("share_image_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_seo_v" ADD CONSTRAINT "_seo_v_version_landing_page_image_id_assets_id_fk" FOREIGN KEY ("version_landing_page_image_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_seo_v" ADD CONSTRAINT "_seo_v_version_works_page_image_id_assets_id_fk" FOREIGN KEY ("version_works_page_image_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_seo_v" ADD CONSTRAINT "_seo_v_version_share_image_id_assets_id_fk" FOREIGN KEY ("version_share_image_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "seo_landing_page_landing_page_image_idx" ON "seo" USING btree ("landing_page_image_id");
  CREATE INDEX "seo_works_page_works_page_image_idx" ON "seo" USING btree ("works_page_image_id");
  CREATE INDEX "seo_share_image_idx" ON "seo" USING btree ("share_image_id");
  CREATE INDEX "seo__status_idx" ON "seo" USING btree ("_status");
  CREATE INDEX "_seo_v_version_landing_page_version_landing_page_image_idx" ON "_seo_v" USING btree ("version_landing_page_image_id");
  CREATE INDEX "_seo_v_version_works_page_version_works_page_image_idx" ON "_seo_v" USING btree ("version_works_page_image_id");
  CREATE INDEX "_seo_v_version_version_share_image_idx" ON "_seo_v" USING btree ("version_share_image_id");
  CREATE INDEX "_seo_v_version_version__status_idx" ON "_seo_v" USING btree ("version__status");
  CREATE INDEX "_seo_v_created_at_idx" ON "_seo_v" USING btree ("created_at");
  CREATE INDEX "_seo_v_updated_at_idx" ON "_seo_v" USING btree ("updated_at");
  CREATE INDEX "_seo_v_latest_idx" ON "_seo_v" USING btree ("latest");
  CREATE INDEX "_seo_v_autosave_idx" ON "_seo_v" USING btree ("autosave");
  ALTER TABLE "works" ADD CONSTRAINT "works_meta_image_id_assets_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_works_v" ADD CONSTRAINT "_works_v_version_meta_image_id_assets_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "works_meta_meta_image_idx" ON "works" USING btree ("meta_image_id");
  CREATE INDEX "_works_v_version_meta_version_meta_image_idx" ON "_works_v" USING btree ("version_meta_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "seo" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_seo_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "seo" CASCADE;
  DROP TABLE "_seo_v" CASCADE;
  ALTER TABLE "works" DROP CONSTRAINT "works_meta_image_id_assets_id_fk";
  
  ALTER TABLE "_works_v" DROP CONSTRAINT "_works_v_version_meta_image_id_assets_id_fk";
  
  DROP INDEX "works_meta_meta_image_idx";
  DROP INDEX "_works_v_version_meta_version_meta_image_idx";
  ALTER TABLE "works" DROP COLUMN "meta_title";
  ALTER TABLE "works" DROP COLUMN "meta_description";
  ALTER TABLE "works" DROP COLUMN "meta_image_id";
  ALTER TABLE "_works_v" DROP COLUMN "version_meta_title";
  ALTER TABLE "_works_v" DROP COLUMN "version_meta_description";
  ALTER TABLE "_works_v" DROP COLUMN "version_meta_image_id";
  DROP TYPE "public"."enum_seo_status";
  DROP TYPE "public"."enum__seo_v_version_status";`)
}
