import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "badges" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"icon_id" integer NOT NULL,
  	"color" varchar DEFAULT '#F2631C' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "works" ADD COLUMN "badge_id" integer;
  ALTER TABLE "_works_v" ADD COLUMN "version_badge_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "badges_id" integer;
  ALTER TABLE "badges" ADD CONSTRAINT "badges_icon_id_assets_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "badges_icon_idx" ON "badges" USING btree ("icon_id");
  CREATE INDEX "badges_updated_at_idx" ON "badges" USING btree ("updated_at");
  CREATE INDEX "badges_created_at_idx" ON "badges" USING btree ("created_at");
  ALTER TABLE "works" ADD CONSTRAINT "works_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_works_v" ADD CONSTRAINT "_works_v_version_badge_id_badges_id_fk" FOREIGN KEY ("version_badge_id") REFERENCES "public"."badges"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_badges_fk" FOREIGN KEY ("badges_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "works_badge_idx" ON "works" USING btree ("badge_id");
  CREATE INDEX "_works_v_version_version_badge_idx" ON "_works_v" USING btree ("version_badge_id");
  CREATE INDEX "payload_locked_documents_rels_badges_id_idx" ON "payload_locked_documents_rels" USING btree ("badges_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "badges" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "badges" CASCADE;
  ALTER TABLE "works" DROP CONSTRAINT "works_badge_id_badges_id_fk";
  
  ALTER TABLE "_works_v" DROP CONSTRAINT "_works_v_version_badge_id_badges_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_badges_fk";
  
  DROP INDEX "works_badge_idx";
  DROP INDEX "_works_v_version_version_badge_idx";
  DROP INDEX "payload_locked_documents_rels_badges_id_idx";
  ALTER TABLE "works" DROP COLUMN "badge_id";
  ALTER TABLE "_works_v" DROP COLUMN "version_badge_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "badges_id";`)
}
