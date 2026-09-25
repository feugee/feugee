import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_footer_social_links_platform" ADD VALUE IF NOT EXISTS 'behance';
  ALTER TYPE "public"."enum_footer_social_links_platform" ADD VALUE IF NOT EXISTS 'linkedin';
  ALTER TYPE "public"."enum_footer_social_links_platform" ADD VALUE IF NOT EXISTS 'pinterest';
  ALTER TYPE "public"."enum_footer_social_links_platform" ADD VALUE IF NOT EXISTS 'dribbble';
  ALTER TYPE "public"."enum_footer_social_links_platform" ADD VALUE IF NOT EXISTS 'contra';
  ALTER TYPE "public"."enum__footer_v_version_social_links_platform" ADD VALUE IF NOT EXISTS 'behance';
  ALTER TYPE "public"."enum__footer_v_version_social_links_platform" ADD VALUE IF NOT EXISTS 'linkedin';
  ALTER TYPE "public"."enum__footer_v_version_social_links_platform" ADD VALUE IF NOT EXISTS 'pinterest';
  ALTER TYPE "public"."enum__footer_v_version_social_links_platform" ADD VALUE IF NOT EXISTS 'dribbble';
  ALTER TYPE "public"."enum__footer_v_version_social_links_platform" ADD VALUE IF NOT EXISTS 'contra';
  ALTER TABLE "footer" ADD COLUMN IF NOT EXISTS "cta_secondary_action_label" varchar;
  ALTER TABLE "footer" ADD COLUMN IF NOT EXISTS "cta_secondary_action_url" varchar;
  ALTER TABLE "_footer_v" ADD COLUMN IF NOT EXISTS "version_cta_secondary_action_label" varchar;
  ALTER TABLE "_footer_v" ADD COLUMN IF NOT EXISTS "version_cta_secondary_action_url" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "footer_social_links" ALTER COLUMN "platform" SET DATA TYPE text;
  DROP TYPE "public"."enum_footer_social_links_platform";
  CREATE TYPE "public"."enum_footer_social_links_platform" AS ENUM('facebook', 'instagram', 'x');
  ALTER TABLE "footer_social_links" ALTER COLUMN "platform" SET DATA TYPE "public"."enum_footer_social_links_platform" USING "platform"::"public"."enum_footer_social_links_platform";
  ALTER TABLE "_footer_v_version_social_links" ALTER COLUMN "platform" SET DATA TYPE text;
  DROP TYPE "public"."enum__footer_v_version_social_links_platform";
  CREATE TYPE "public"."enum__footer_v_version_social_links_platform" AS ENUM('facebook', 'instagram', 'x');
  ALTER TABLE "_footer_v_version_social_links" ALTER COLUMN "platform" SET DATA TYPE "public"."enum__footer_v_version_social_links_platform" USING "platform"::"public"."enum__footer_v_version_social_links_platform";
  ALTER TABLE "footer" DROP COLUMN "cta_secondary_action_label";
  ALTER TABLE "footer" DROP COLUMN "cta_secondary_action_url";
  ALTER TABLE "_footer_v" DROP COLUMN "version_cta_secondary_action_label";
  ALTER TABLE "_footer_v" DROP COLUMN "version_cta_secondary_action_url";`)
}
