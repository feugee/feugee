import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "landing_page" ADD COLUMN "hero_lead_in_word" varchar DEFAULT 'Into';
  ALTER TABLE "landing_page" ADD COLUMN "hero_scroll_cue_label" varchar DEFAULT 'Scroll to explore';
  ALTER TABLE "landing_page" ADD COLUMN "hero_scroll_cue_url" varchar;
  ALTER TABLE "landing_page" ADD COLUMN "clients_heading" varchar DEFAULT 'Clients Ideas We''ve Visualized';
  ALTER TABLE "landing_page" ADD COLUMN "selected_works_heading" varchar DEFAULT 'Selected Works';
  ALTER TABLE "_landing_page_v" ADD COLUMN "version_hero_lead_in_word" varchar DEFAULT 'Into';
  ALTER TABLE "_landing_page_v" ADD COLUMN "version_hero_scroll_cue_label" varchar DEFAULT 'Scroll to explore';
  ALTER TABLE "_landing_page_v" ADD COLUMN "version_hero_scroll_cue_url" varchar;
  ALTER TABLE "_landing_page_v" ADD COLUMN "version_clients_heading" varchar DEFAULT 'Clients Ideas We''ve Visualized';
  ALTER TABLE "_landing_page_v" ADD COLUMN "version_selected_works_heading" varchar DEFAULT 'Selected Works';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "landing_page" DROP COLUMN "hero_lead_in_word";
  ALTER TABLE "landing_page" DROP COLUMN "hero_scroll_cue_label";
  ALTER TABLE "landing_page" DROP COLUMN "hero_scroll_cue_url";
  ALTER TABLE "landing_page" DROP COLUMN "clients_heading";
  ALTER TABLE "landing_page" DROP COLUMN "selected_works_heading";
  ALTER TABLE "_landing_page_v" DROP COLUMN "version_hero_lead_in_word";
  ALTER TABLE "_landing_page_v" DROP COLUMN "version_hero_scroll_cue_label";
  ALTER TABLE "_landing_page_v" DROP COLUMN "version_hero_scroll_cue_url";
  ALTER TABLE "_landing_page_v" DROP COLUMN "version_clients_heading";
  ALTER TABLE "_landing_page_v" DROP COLUMN "version_selected_works_heading";`)
}
