import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_works_blocks_text_vertical_alignment" AS ENUM('top', 'center', 'bottom');
  CREATE TYPE "public"."enum__works_v_blocks_text_vertical_alignment" AS ENUM('top', 'center', 'bottom');
  ALTER TABLE "works_blocks_text" ADD COLUMN "vertical_alignment" "enum_works_blocks_text_vertical_alignment" DEFAULT 'bottom';
  ALTER TABLE "_works_v_blocks_text" ADD COLUMN "vertical_alignment" "enum__works_v_blocks_text_vertical_alignment" DEFAULT 'bottom';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "works_blocks_text" DROP COLUMN "vertical_alignment";
  ALTER TABLE "_works_v_blocks_text" DROP COLUMN "vertical_alignment";
  DROP TYPE "public"."enum_works_blocks_text_vertical_alignment";
  DROP TYPE "public"."enum__works_v_blocks_text_vertical_alignment";`)
}
