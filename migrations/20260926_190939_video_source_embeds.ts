import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_works_blocks_asset_asset_source" AS ENUM('asset', 'embed');
  CREATE TYPE "public"."enum_works_blocks_asset_asset_embed_provider" AS ENUM('youtube');
  CREATE TYPE "public"."enum_works_thumbnail_source" AS ENUM('asset', 'embed');
  CREATE TYPE "public"."enum_works_thumbnail_embed_provider" AS ENUM('youtube');
  CREATE TYPE "public"."enum_works_feature_visual_source" AS ENUM('asset', 'embed');
  CREATE TYPE "public"."enum_works_feature_visual_embed_provider" AS ENUM('youtube');
  CREATE TYPE "public"."enum__works_v_blocks_asset_asset_source" AS ENUM('asset', 'embed');
  CREATE TYPE "public"."enum__works_v_blocks_asset_asset_embed_provider" AS ENUM('youtube');
  CREATE TYPE "public"."enum__works_v_version_thumbnail_source" AS ENUM('asset', 'embed');
  CREATE TYPE "public"."enum__works_v_version_thumbnail_embed_provider" AS ENUM('youtube');
  CREATE TYPE "public"."enum__works_v_version_feature_visual_source" AS ENUM('asset', 'embed');
  CREATE TYPE "public"."enum__works_v_version_feature_visual_embed_provider" AS ENUM('youtube');
  CREATE TYPE "public"."enum_landing_page_hero_slides_video_source" AS ENUM('asset', 'embed');
  CREATE TYPE "public"."enum_landing_page_hero_slides_video_embed_provider" AS ENUM('youtube');
  CREATE TYPE "public"."enum__landing_page_v_version_hero_slides_video_source" AS ENUM('asset', 'embed');
  CREATE TYPE "public"."enum__landing_page_v_version_hero_slides_video_embed_provider" AS ENUM('youtube');
  ALTER TABLE "works_blocks_asset" DROP CONSTRAINT "works_blocks_asset_asset_id_assets_id_fk";
  
  ALTER TABLE "works" DROP CONSTRAINT "works_thumbnail_id_assets_id_fk";
  
  ALTER TABLE "works" DROP CONSTRAINT "works_feature_visual_id_assets_id_fk";
  
  ALTER TABLE "_works_v_blocks_asset" DROP CONSTRAINT "_works_v_blocks_asset_asset_id_assets_id_fk";
  
  ALTER TABLE "_works_v" DROP CONSTRAINT "_works_v_version_thumbnail_id_assets_id_fk";
  
  ALTER TABLE "_works_v" DROP CONSTRAINT "_works_v_version_feature_visual_id_assets_id_fk";
  
  ALTER TABLE "landing_page_hero_slides" DROP CONSTRAINT "landing_page_hero_slides_video_id_assets_id_fk";
  
  ALTER TABLE "_landing_page_v_version_hero_slides" DROP CONSTRAINT "_landing_page_v_version_hero_slides_video_id_assets_id_fk";
  
  DROP INDEX "works_blocks_asset_asset_idx";
  DROP INDEX "works_thumbnail_idx";
  DROP INDEX "works_feature_visual_idx";
  DROP INDEX "_works_v_blocks_asset_asset_idx";
  DROP INDEX "_works_v_version_version_thumbnail_idx";
  DROP INDEX "_works_v_version_version_feature_visual_idx";
  DROP INDEX "landing_page_hero_slides_video_idx";
  DROP INDEX "_landing_page_v_version_hero_slides_video_idx";
  ALTER TABLE "works_blocks_asset" ADD COLUMN "asset_source" "enum_works_blocks_asset_asset_source" DEFAULT 'asset';
  ALTER TABLE "works_blocks_asset" ADD COLUMN "asset_asset_id" integer;
  ALTER TABLE "works_blocks_asset" ADD COLUMN "asset_embed_provider" "enum_works_blocks_asset_asset_embed_provider" DEFAULT 'youtube';
  ALTER TABLE "works_blocks_asset" ADD COLUMN "asset_embed_url" varchar;
  ALTER TABLE "works_blocks_asset" ADD COLUMN "asset_embed_alt" varchar;
  ALTER TABLE "works_blocks_asset" ADD COLUMN "asset_embed_video_id" varchar;
  ALTER TABLE "works_blocks_asset" ADD COLUMN "asset_embed_poster_id" integer;
  ALTER TABLE "works" ADD COLUMN "thumbnail_source" "enum_works_thumbnail_source" DEFAULT 'asset';
  ALTER TABLE "works" ADD COLUMN "thumbnail_asset_id" integer;
  ALTER TABLE "works" ADD COLUMN "thumbnail_embed_provider" "enum_works_thumbnail_embed_provider" DEFAULT 'youtube';
  ALTER TABLE "works" ADD COLUMN "thumbnail_embed_url" varchar;
  ALTER TABLE "works" ADD COLUMN "thumbnail_embed_alt" varchar;
  ALTER TABLE "works" ADD COLUMN "thumbnail_embed_video_id" varchar;
  ALTER TABLE "works" ADD COLUMN "thumbnail_embed_poster_id" integer;
  ALTER TABLE "works" ADD COLUMN "feature_visual_source" "enum_works_feature_visual_source" DEFAULT 'asset';
  ALTER TABLE "works" ADD COLUMN "feature_visual_asset_id" integer;
  ALTER TABLE "works" ADD COLUMN "feature_visual_embed_provider" "enum_works_feature_visual_embed_provider" DEFAULT 'youtube';
  ALTER TABLE "works" ADD COLUMN "feature_visual_embed_url" varchar;
  ALTER TABLE "works" ADD COLUMN "feature_visual_embed_alt" varchar;
  ALTER TABLE "works" ADD COLUMN "feature_visual_embed_video_id" varchar;
  ALTER TABLE "works" ADD COLUMN "feature_visual_embed_poster_id" integer;
  ALTER TABLE "_works_v_blocks_asset" ADD COLUMN "asset_source" "enum__works_v_blocks_asset_asset_source" DEFAULT 'asset';
  ALTER TABLE "_works_v_blocks_asset" ADD COLUMN "asset_asset_id" integer;
  ALTER TABLE "_works_v_blocks_asset" ADD COLUMN "asset_embed_provider" "enum__works_v_blocks_asset_asset_embed_provider" DEFAULT 'youtube';
  ALTER TABLE "_works_v_blocks_asset" ADD COLUMN "asset_embed_url" varchar;
  ALTER TABLE "_works_v_blocks_asset" ADD COLUMN "asset_embed_alt" varchar;
  ALTER TABLE "_works_v_blocks_asset" ADD COLUMN "asset_embed_video_id" varchar;
  ALTER TABLE "_works_v_blocks_asset" ADD COLUMN "asset_embed_poster_id" integer;
  ALTER TABLE "_works_v" ADD COLUMN "version_thumbnail_source" "enum__works_v_version_thumbnail_source" DEFAULT 'asset';
  ALTER TABLE "_works_v" ADD COLUMN "version_thumbnail_asset_id" integer;
  ALTER TABLE "_works_v" ADD COLUMN "version_thumbnail_embed_provider" "enum__works_v_version_thumbnail_embed_provider" DEFAULT 'youtube';
  ALTER TABLE "_works_v" ADD COLUMN "version_thumbnail_embed_url" varchar;
  ALTER TABLE "_works_v" ADD COLUMN "version_thumbnail_embed_alt" varchar;
  ALTER TABLE "_works_v" ADD COLUMN "version_thumbnail_embed_video_id" varchar;
  ALTER TABLE "_works_v" ADD COLUMN "version_thumbnail_embed_poster_id" integer;
  ALTER TABLE "_works_v" ADD COLUMN "version_feature_visual_source" "enum__works_v_version_feature_visual_source" DEFAULT 'asset';
  ALTER TABLE "_works_v" ADD COLUMN "version_feature_visual_asset_id" integer;
  ALTER TABLE "_works_v" ADD COLUMN "version_feature_visual_embed_provider" "enum__works_v_version_feature_visual_embed_provider" DEFAULT 'youtube';
  ALTER TABLE "_works_v" ADD COLUMN "version_feature_visual_embed_url" varchar;
  ALTER TABLE "_works_v" ADD COLUMN "version_feature_visual_embed_alt" varchar;
  ALTER TABLE "_works_v" ADD COLUMN "version_feature_visual_embed_video_id" varchar;
  ALTER TABLE "_works_v" ADD COLUMN "version_feature_visual_embed_poster_id" integer;
  ALTER TABLE "landing_page_hero_slides" ADD COLUMN "video_source" "enum_landing_page_hero_slides_video_source" DEFAULT 'asset';
  ALTER TABLE "landing_page_hero_slides" ADD COLUMN "video_asset_id" integer;
  ALTER TABLE "landing_page_hero_slides" ADD COLUMN "video_embed_provider" "enum_landing_page_hero_slides_video_embed_provider" DEFAULT 'youtube';
  ALTER TABLE "landing_page_hero_slides" ADD COLUMN "video_embed_url" varchar;
  ALTER TABLE "landing_page_hero_slides" ADD COLUMN "video_embed_alt" varchar;
  ALTER TABLE "landing_page_hero_slides" ADD COLUMN "video_embed_video_id" varchar;
  ALTER TABLE "landing_page_hero_slides" ADD COLUMN "video_embed_poster_id" integer;
  ALTER TABLE "_landing_page_v_version_hero_slides" ADD COLUMN "video_source" "enum__landing_page_v_version_hero_slides_video_source" DEFAULT 'asset';
  ALTER TABLE "_landing_page_v_version_hero_slides" ADD COLUMN "video_asset_id" integer;
  ALTER TABLE "_landing_page_v_version_hero_slides" ADD COLUMN "video_embed_provider" "enum__landing_page_v_version_hero_slides_video_embed_provider" DEFAULT 'youtube';
  ALTER TABLE "_landing_page_v_version_hero_slides" ADD COLUMN "video_embed_url" varchar;
  ALTER TABLE "_landing_page_v_version_hero_slides" ADD COLUMN "video_embed_alt" varchar;
  ALTER TABLE "_landing_page_v_version_hero_slides" ADD COLUMN "video_embed_video_id" varchar;
  ALTER TABLE "_landing_page_v_version_hero_slides" ADD COLUMN "video_embed_poster_id" integer;
  ALTER TABLE "works_blocks_asset" ADD CONSTRAINT "works_blocks_asset_asset_asset_id_assets_id_fk" FOREIGN KEY ("asset_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "works_blocks_asset" ADD CONSTRAINT "works_blocks_asset_asset_embed_poster_id_assets_id_fk" FOREIGN KEY ("asset_embed_poster_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "works" ADD CONSTRAINT "works_thumbnail_asset_id_assets_id_fk" FOREIGN KEY ("thumbnail_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "works" ADD CONSTRAINT "works_thumbnail_embed_poster_id_assets_id_fk" FOREIGN KEY ("thumbnail_embed_poster_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "works" ADD CONSTRAINT "works_feature_visual_asset_id_assets_id_fk" FOREIGN KEY ("feature_visual_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "works" ADD CONSTRAINT "works_feature_visual_embed_poster_id_assets_id_fk" FOREIGN KEY ("feature_visual_embed_poster_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_works_v_blocks_asset" ADD CONSTRAINT "_works_v_blocks_asset_asset_asset_id_assets_id_fk" FOREIGN KEY ("asset_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_works_v_blocks_asset" ADD CONSTRAINT "_works_v_blocks_asset_asset_embed_poster_id_assets_id_fk" FOREIGN KEY ("asset_embed_poster_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_works_v" ADD CONSTRAINT "_works_v_version_thumbnail_asset_id_assets_id_fk" FOREIGN KEY ("version_thumbnail_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_works_v" ADD CONSTRAINT "_works_v_version_thumbnail_embed_poster_id_assets_id_fk" FOREIGN KEY ("version_thumbnail_embed_poster_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_works_v" ADD CONSTRAINT "_works_v_version_feature_visual_asset_id_assets_id_fk" FOREIGN KEY ("version_feature_visual_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_works_v" ADD CONSTRAINT "_works_v_version_feature_visual_embed_poster_id_assets_id_fk" FOREIGN KEY ("version_feature_visual_embed_poster_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "landing_page_hero_slides" ADD CONSTRAINT "landing_page_hero_slides_video_asset_id_assets_id_fk" FOREIGN KEY ("video_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "landing_page_hero_slides" ADD CONSTRAINT "landing_page_hero_slides_video_embed_poster_id_assets_id_fk" FOREIGN KEY ("video_embed_poster_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_landing_page_v_version_hero_slides" ADD CONSTRAINT "_landing_page_v_version_hero_slides_video_asset_id_assets_id_fk" FOREIGN KEY ("video_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_landing_page_v_version_hero_slides" ADD CONSTRAINT "_landing_page_v_version_hero_slides_video_embed_poster_id_assets_id_fk" FOREIGN KEY ("video_embed_poster_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "works_blocks_asset_asset_asset_asset_idx" ON "works_blocks_asset" USING btree ("asset_asset_id");
  CREATE INDEX "works_blocks_asset_asset_embed_asset_embed_poster_idx" ON "works_blocks_asset" USING btree ("asset_embed_poster_id");
  CREATE INDEX "works_thumbnail_thumbnail_asset_idx" ON "works" USING btree ("thumbnail_asset_id");
  CREATE INDEX "works_thumbnail_embed_thumbnail_embed_poster_idx" ON "works" USING btree ("thumbnail_embed_poster_id");
  CREATE INDEX "works_feature_visual_feature_visual_asset_idx" ON "works" USING btree ("feature_visual_asset_id");
  CREATE INDEX "works_feature_visual_embed_feature_visual_embed_poster_idx" ON "works" USING btree ("feature_visual_embed_poster_id");
  CREATE INDEX "_works_v_blocks_asset_asset_asset_asset_idx" ON "_works_v_blocks_asset" USING btree ("asset_asset_id");
  CREATE INDEX "_works_v_blocks_asset_asset_embed_asset_embed_poster_idx" ON "_works_v_blocks_asset" USING btree ("asset_embed_poster_id");
  CREATE INDEX "_works_v_version_thumbnail_version_thumbnail_asset_idx" ON "_works_v" USING btree ("version_thumbnail_asset_id");
  CREATE INDEX "_works_v_version_thumbnail_embed_version_thumbnail_embed_idx" ON "_works_v" USING btree ("version_thumbnail_embed_poster_id");
  CREATE INDEX "_works_v_version_feature_visual_version_feature_visual_a_idx" ON "_works_v" USING btree ("version_feature_visual_asset_id");
  CREATE INDEX "_works_v_version_feature_visual_embed_version_feature_vi_idx" ON "_works_v" USING btree ("version_feature_visual_embed_poster_id");
  CREATE INDEX "landing_page_hero_slides_video_video_asset_idx" ON "landing_page_hero_slides" USING btree ("video_asset_id");
  CREATE INDEX "landing_page_hero_slides_video_embed_video_embed_poster_idx" ON "landing_page_hero_slides" USING btree ("video_embed_poster_id");
  CREATE INDEX "_landing_page_v_version_hero_slides_video_video_asset_idx" ON "_landing_page_v_version_hero_slides" USING btree ("video_asset_id");
  CREATE INDEX "_landing_page_v_version_hero_slides_video_embed_video_em_idx" ON "_landing_page_v_version_hero_slides" USING btree ("video_embed_poster_id");
  -- Backfill: every existing upload moves into its Video Source group as the
  -- "asset" source (the source columns' default), carried over before the
  -- old columns drop. Version tables included — drafts keep their visuals.
  UPDATE "works" SET "thumbnail_source" = 'asset', "thumbnail_asset_id" = "thumbnail_id" WHERE "thumbnail_id" IS NOT NULL;
  UPDATE "works" SET "feature_visual_source" = 'asset', "feature_visual_asset_id" = "feature_visual_id" WHERE "feature_visual_id" IS NOT NULL;
  UPDATE "_works_v" SET "version_thumbnail_source" = 'asset', "version_thumbnail_asset_id" = "version_thumbnail_id" WHERE "version_thumbnail_id" IS NOT NULL;
  UPDATE "_works_v" SET "version_feature_visual_source" = 'asset', "version_feature_visual_asset_id" = "version_feature_visual_id" WHERE "version_feature_visual_id" IS NOT NULL;
  UPDATE "works_blocks_asset" SET "asset_source" = 'asset', "asset_asset_id" = "asset_id" WHERE "asset_id" IS NOT NULL;
  UPDATE "_works_v_blocks_asset" SET "asset_source" = 'asset', "asset_asset_id" = "asset_id" WHERE "asset_id" IS NOT NULL;
  UPDATE "landing_page_hero_slides" SET "video_source" = 'asset', "video_asset_id" = "video_id" WHERE "video_id" IS NOT NULL;
  UPDATE "_landing_page_v_version_hero_slides" SET "video_source" = 'asset', "video_asset_id" = "video_id" WHERE "video_id" IS NOT NULL;
  ALTER TABLE "works_blocks_asset" DROP COLUMN "asset_id";
  ALTER TABLE "works" DROP COLUMN "thumbnail_id";
  ALTER TABLE "works" DROP COLUMN "feature_visual_id";
  ALTER TABLE "_works_v_blocks_asset" DROP COLUMN "asset_id";
  ALTER TABLE "_works_v" DROP COLUMN "version_thumbnail_id";
  ALTER TABLE "_works_v" DROP COLUMN "version_feature_visual_id";
  ALTER TABLE "landing_page_hero_slides" DROP COLUMN "video_id";
  ALTER TABLE "_landing_page_v_version_hero_slides" DROP COLUMN "video_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "works_blocks_asset" DROP CONSTRAINT "works_blocks_asset_asset_asset_id_assets_id_fk";
  
  ALTER TABLE "works_blocks_asset" DROP CONSTRAINT "works_blocks_asset_asset_embed_poster_id_assets_id_fk";
  
  ALTER TABLE "works" DROP CONSTRAINT "works_thumbnail_asset_id_assets_id_fk";
  
  ALTER TABLE "works" DROP CONSTRAINT "works_thumbnail_embed_poster_id_assets_id_fk";
  
  ALTER TABLE "works" DROP CONSTRAINT "works_feature_visual_asset_id_assets_id_fk";
  
  ALTER TABLE "works" DROP CONSTRAINT "works_feature_visual_embed_poster_id_assets_id_fk";
  
  ALTER TABLE "_works_v_blocks_asset" DROP CONSTRAINT "_works_v_blocks_asset_asset_asset_id_assets_id_fk";
  
  ALTER TABLE "_works_v_blocks_asset" DROP CONSTRAINT "_works_v_blocks_asset_asset_embed_poster_id_assets_id_fk";
  
  ALTER TABLE "_works_v" DROP CONSTRAINT "_works_v_version_thumbnail_asset_id_assets_id_fk";
  
  ALTER TABLE "_works_v" DROP CONSTRAINT "_works_v_version_thumbnail_embed_poster_id_assets_id_fk";
  
  ALTER TABLE "_works_v" DROP CONSTRAINT "_works_v_version_feature_visual_asset_id_assets_id_fk";
  
  ALTER TABLE "_works_v" DROP CONSTRAINT "_works_v_version_feature_visual_embed_poster_id_assets_id_fk";
  
  ALTER TABLE "landing_page_hero_slides" DROP CONSTRAINT "landing_page_hero_slides_video_asset_id_assets_id_fk";
  
  ALTER TABLE "landing_page_hero_slides" DROP CONSTRAINT "landing_page_hero_slides_video_embed_poster_id_assets_id_fk";
  
  ALTER TABLE "_landing_page_v_version_hero_slides" DROP CONSTRAINT "_landing_page_v_version_hero_slides_video_asset_id_assets_id_fk";
  
  ALTER TABLE "_landing_page_v_version_hero_slides" DROP CONSTRAINT "_landing_page_v_version_hero_slides_video_embed_poster_id_assets_id_fk";
  
  DROP INDEX "works_blocks_asset_asset_asset_asset_idx";
  DROP INDEX "works_blocks_asset_asset_embed_asset_embed_poster_idx";
  DROP INDEX "works_thumbnail_thumbnail_asset_idx";
  DROP INDEX "works_thumbnail_embed_thumbnail_embed_poster_idx";
  DROP INDEX "works_feature_visual_feature_visual_asset_idx";
  DROP INDEX "works_feature_visual_embed_feature_visual_embed_poster_idx";
  DROP INDEX "_works_v_blocks_asset_asset_asset_asset_idx";
  DROP INDEX "_works_v_blocks_asset_asset_embed_asset_embed_poster_idx";
  DROP INDEX "_works_v_version_thumbnail_version_thumbnail_asset_idx";
  DROP INDEX "_works_v_version_thumbnail_embed_version_thumbnail_embed_idx";
  DROP INDEX "_works_v_version_feature_visual_version_feature_visual_a_idx";
  DROP INDEX "_works_v_version_feature_visual_embed_version_feature_vi_idx";
  DROP INDEX "landing_page_hero_slides_video_video_asset_idx";
  DROP INDEX "landing_page_hero_slides_video_embed_video_embed_poster_idx";
  DROP INDEX "_landing_page_v_version_hero_slides_video_video_asset_idx";
  DROP INDEX "_landing_page_v_version_hero_slides_video_embed_video_em_idx";
  ALTER TABLE "works_blocks_asset" ADD COLUMN "asset_id" integer;
  ALTER TABLE "works" ADD COLUMN "thumbnail_id" integer;
  ALTER TABLE "works" ADD COLUMN "feature_visual_id" integer;
  ALTER TABLE "_works_v_blocks_asset" ADD COLUMN "asset_id" integer;
  ALTER TABLE "_works_v" ADD COLUMN "version_thumbnail_id" integer;
  ALTER TABLE "_works_v" ADD COLUMN "version_feature_visual_id" integer;
  ALTER TABLE "landing_page_hero_slides" ADD COLUMN "video_id" integer;
  ALTER TABLE "_landing_page_v_version_hero_slides" ADD COLUMN "video_id" integer;
  ALTER TABLE "works_blocks_asset" ADD CONSTRAINT "works_blocks_asset_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "works" ADD CONSTRAINT "works_thumbnail_id_assets_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "works" ADD CONSTRAINT "works_feature_visual_id_assets_id_fk" FOREIGN KEY ("feature_visual_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_works_v_blocks_asset" ADD CONSTRAINT "_works_v_blocks_asset_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_works_v" ADD CONSTRAINT "_works_v_version_thumbnail_id_assets_id_fk" FOREIGN KEY ("version_thumbnail_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_works_v" ADD CONSTRAINT "_works_v_version_feature_visual_id_assets_id_fk" FOREIGN KEY ("version_feature_visual_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "landing_page_hero_slides" ADD CONSTRAINT "landing_page_hero_slides_video_id_assets_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_landing_page_v_version_hero_slides" ADD CONSTRAINT "_landing_page_v_version_hero_slides_video_id_assets_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "works_blocks_asset_asset_idx" ON "works_blocks_asset" USING btree ("asset_id");
  CREATE INDEX "works_thumbnail_idx" ON "works" USING btree ("thumbnail_id");
  CREATE INDEX "works_feature_visual_idx" ON "works" USING btree ("feature_visual_id");
  CREATE INDEX "_works_v_blocks_asset_asset_idx" ON "_works_v_blocks_asset" USING btree ("asset_id");
  CREATE INDEX "_works_v_version_version_thumbnail_idx" ON "_works_v" USING btree ("version_thumbnail_id");
  CREATE INDEX "_works_v_version_version_feature_visual_idx" ON "_works_v" USING btree ("version_feature_visual_id");
  CREATE INDEX "landing_page_hero_slides_video_idx" ON "landing_page_hero_slides" USING btree ("video_id");
  CREATE INDEX "_landing_page_v_version_hero_slides_video_idx" ON "_landing_page_v_version_hero_slides" USING btree ("video_id");
  ALTER TABLE "works_blocks_asset" DROP COLUMN "asset_source";
  ALTER TABLE "works_blocks_asset" DROP COLUMN "asset_asset_id";
  ALTER TABLE "works_blocks_asset" DROP COLUMN "asset_embed_provider";
  ALTER TABLE "works_blocks_asset" DROP COLUMN "asset_embed_url";
  ALTER TABLE "works_blocks_asset" DROP COLUMN "asset_embed_alt";
  ALTER TABLE "works_blocks_asset" DROP COLUMN "asset_embed_video_id";
  ALTER TABLE "works_blocks_asset" DROP COLUMN "asset_embed_poster_id";
  ALTER TABLE "works" DROP COLUMN "thumbnail_source";
  ALTER TABLE "works" DROP COLUMN "thumbnail_asset_id";
  ALTER TABLE "works" DROP COLUMN "thumbnail_embed_provider";
  ALTER TABLE "works" DROP COLUMN "thumbnail_embed_url";
  ALTER TABLE "works" DROP COLUMN "thumbnail_embed_alt";
  ALTER TABLE "works" DROP COLUMN "thumbnail_embed_video_id";
  ALTER TABLE "works" DROP COLUMN "thumbnail_embed_poster_id";
  ALTER TABLE "works" DROP COLUMN "feature_visual_source";
  ALTER TABLE "works" DROP COLUMN "feature_visual_asset_id";
  ALTER TABLE "works" DROP COLUMN "feature_visual_embed_provider";
  ALTER TABLE "works" DROP COLUMN "feature_visual_embed_url";
  ALTER TABLE "works" DROP COLUMN "feature_visual_embed_alt";
  ALTER TABLE "works" DROP COLUMN "feature_visual_embed_video_id";
  ALTER TABLE "works" DROP COLUMN "feature_visual_embed_poster_id";
  ALTER TABLE "_works_v_blocks_asset" DROP COLUMN "asset_source";
  ALTER TABLE "_works_v_blocks_asset" DROP COLUMN "asset_asset_id";
  ALTER TABLE "_works_v_blocks_asset" DROP COLUMN "asset_embed_provider";
  ALTER TABLE "_works_v_blocks_asset" DROP COLUMN "asset_embed_url";
  ALTER TABLE "_works_v_blocks_asset" DROP COLUMN "asset_embed_alt";
  ALTER TABLE "_works_v_blocks_asset" DROP COLUMN "asset_embed_video_id";
  ALTER TABLE "_works_v_blocks_asset" DROP COLUMN "asset_embed_poster_id";
  ALTER TABLE "_works_v" DROP COLUMN "version_thumbnail_source";
  ALTER TABLE "_works_v" DROP COLUMN "version_thumbnail_asset_id";
  ALTER TABLE "_works_v" DROP COLUMN "version_thumbnail_embed_provider";
  ALTER TABLE "_works_v" DROP COLUMN "version_thumbnail_embed_url";
  ALTER TABLE "_works_v" DROP COLUMN "version_thumbnail_embed_alt";
  ALTER TABLE "_works_v" DROP COLUMN "version_thumbnail_embed_video_id";
  ALTER TABLE "_works_v" DROP COLUMN "version_thumbnail_embed_poster_id";
  ALTER TABLE "_works_v" DROP COLUMN "version_feature_visual_source";
  ALTER TABLE "_works_v" DROP COLUMN "version_feature_visual_asset_id";
  ALTER TABLE "_works_v" DROP COLUMN "version_feature_visual_embed_provider";
  ALTER TABLE "_works_v" DROP COLUMN "version_feature_visual_embed_url";
  ALTER TABLE "_works_v" DROP COLUMN "version_feature_visual_embed_alt";
  ALTER TABLE "_works_v" DROP COLUMN "version_feature_visual_embed_video_id";
  ALTER TABLE "_works_v" DROP COLUMN "version_feature_visual_embed_poster_id";
  ALTER TABLE "landing_page_hero_slides" DROP COLUMN "video_source";
  ALTER TABLE "landing_page_hero_slides" DROP COLUMN "video_asset_id";
  ALTER TABLE "landing_page_hero_slides" DROP COLUMN "video_embed_provider";
  ALTER TABLE "landing_page_hero_slides" DROP COLUMN "video_embed_url";
  ALTER TABLE "landing_page_hero_slides" DROP COLUMN "video_embed_alt";
  ALTER TABLE "landing_page_hero_slides" DROP COLUMN "video_embed_video_id";
  ALTER TABLE "landing_page_hero_slides" DROP COLUMN "video_embed_poster_id";
  ALTER TABLE "_landing_page_v_version_hero_slides" DROP COLUMN "video_source";
  ALTER TABLE "_landing_page_v_version_hero_slides" DROP COLUMN "video_asset_id";
  ALTER TABLE "_landing_page_v_version_hero_slides" DROP COLUMN "video_embed_provider";
  ALTER TABLE "_landing_page_v_version_hero_slides" DROP COLUMN "video_embed_url";
  ALTER TABLE "_landing_page_v_version_hero_slides" DROP COLUMN "video_embed_alt";
  ALTER TABLE "_landing_page_v_version_hero_slides" DROP COLUMN "video_embed_video_id";
  ALTER TABLE "_landing_page_v_version_hero_slides" DROP COLUMN "video_embed_poster_id";
  DROP TYPE "public"."enum_works_blocks_asset_asset_source";
  DROP TYPE "public"."enum_works_blocks_asset_asset_embed_provider";
  DROP TYPE "public"."enum_works_thumbnail_source";
  DROP TYPE "public"."enum_works_thumbnail_embed_provider";
  DROP TYPE "public"."enum_works_feature_visual_source";
  DROP TYPE "public"."enum_works_feature_visual_embed_provider";
  DROP TYPE "public"."enum__works_v_blocks_asset_asset_source";
  DROP TYPE "public"."enum__works_v_blocks_asset_asset_embed_provider";
  DROP TYPE "public"."enum__works_v_version_thumbnail_source";
  DROP TYPE "public"."enum__works_v_version_thumbnail_embed_provider";
  DROP TYPE "public"."enum__works_v_version_feature_visual_source";
  DROP TYPE "public"."enum__works_v_version_feature_visual_embed_provider";
  DROP TYPE "public"."enum_landing_page_hero_slides_video_source";
  DROP TYPE "public"."enum_landing_page_hero_slides_video_embed_provider";
  DROP TYPE "public"."enum__landing_page_v_version_hero_slides_video_source";
  DROP TYPE "public"."enum__landing_page_v_version_hero_slides_video_embed_provider";`)
}
