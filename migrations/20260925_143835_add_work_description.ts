import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "works" ADD COLUMN IF NOT EXISTS "description" jsonb;
  ALTER TABLE "works" ADD COLUMN IF NOT EXISTS "description_label" varchar DEFAULT 'Overview';
  ALTER TABLE "_works_v" ADD COLUMN IF NOT EXISTS "version_description" jsonb;
  ALTER TABLE "_works_v" ADD COLUMN IF NOT EXISTS "version_description_label" varchar DEFAULT 'Overview';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "works" DROP COLUMN "description";
  ALTER TABLE "works" DROP COLUMN "description_label";
  ALTER TABLE "_works_v" DROP COLUMN "version_description";
  ALTER TABLE "_works_v" DROP COLUMN "version_description_label";`)
}
