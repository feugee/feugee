import * as migration_20260905_141652_init from './20260905_141652_init';
import * as migration_20260910_135501_add_works_and_sectors from './20260910_135501_add_works_and_sectors';
import * as migration_20260910_145544_add_assets_and_work_sections from './20260910_145544_add_assets_and_work_sections';
import * as migration_20260910_154151_add_work_thumbnail from './20260910_154151_add_work_thumbnail';
import * as migration_20260912_125923_add_feature_right_layout from './20260912_125923_add_feature_right_layout';
import * as migration_20260914_125939_add_year_duration_clients_landing_page from './20260914_125939_add_year_duration_clients_landing_page';
import * as migration_20260919_103052_add_landing_page_testimonials from './20260919_103052_add_landing_page_testimonials';
import * as migration_20260920_070322_add_landing_page_hero_rotating_words from './20260920_070322_add_landing_page_hero_rotating_words';
import * as migration_20260920_081137_drop_works_short_description from './20260920_081137_drop_works_short_description';
import * as migration_20260920_123826_move_contact_cta_to_footer from './20260920_123826_move_contact_cta_to_footer';
import * as migration_20260920_123832_add_works_feature_visual from './20260920_123832_add_works_feature_visual';
import * as migration_20260922_194500_add_object_key_and_password_request_at from './20260922_194500_add_object_key_and_password_request_at';
import * as migration_20260922_211800_add_asset_size_variants from './20260922_211800_add_asset_size_variants';
import * as migration_20260922_223608_drop_unused_fields_and_restore_size_indexes from './20260922_223608_drop_unused_fields_and_restore_size_indexes';
import * as migration_20260925_131216_add_landing_page_cms_copy from './20260925_131216_add_landing_page_cms_copy';
import * as migration_20260925_143828_add_footer_social_platforms_and_secondary_cta from './20260925_143828_add_footer_social_platforms_and_secondary_cta';
import * as migration_20260925_143835_add_work_description from './20260925_143835_add_work_description';
import * as migration_20260925_144930_add_text_item_vertical_alignment from './20260925_144930_add_text_item_vertical_alignment';

export const migrations = [
  {
    up: migration_20260905_141652_init.up,
    down: migration_20260905_141652_init.down,
    name: '20260905_141652_init',
  },
  {
    up: migration_20260910_135501_add_works_and_sectors.up,
    down: migration_20260910_135501_add_works_and_sectors.down,
    name: '20260910_135501_add_works_and_sectors',
  },
  {
    up: migration_20260910_145544_add_assets_and_work_sections.up,
    down: migration_20260910_145544_add_assets_and_work_sections.down,
    name: '20260910_145544_add_assets_and_work_sections',
  },
  {
    up: migration_20260910_154151_add_work_thumbnail.up,
    down: migration_20260910_154151_add_work_thumbnail.down,
    name: '20260910_154151_add_work_thumbnail',
  },
  {
    up: migration_20260912_125923_add_feature_right_layout.up,
    down: migration_20260912_125923_add_feature_right_layout.down,
    name: '20260912_125923_add_feature_right_layout',
  },
  {
    up: migration_20260914_125939_add_year_duration_clients_landing_page.up,
    down: migration_20260914_125939_add_year_duration_clients_landing_page.down,
    name: '20260914_125939_add_year_duration_clients_landing_page',
  },
  {
    up: migration_20260919_103052_add_landing_page_testimonials.up,
    down: migration_20260919_103052_add_landing_page_testimonials.down,
    name: '20260919_103052_add_landing_page_testimonials',
  },
  {
    up: migration_20260920_070322_add_landing_page_hero_rotating_words.up,
    down: migration_20260920_070322_add_landing_page_hero_rotating_words.down,
    name: '20260920_070322_add_landing_page_hero_rotating_words',
  },
  {
    up: migration_20260920_081137_drop_works_short_description.up,
    down: migration_20260920_081137_drop_works_short_description.down,
    name: '20260920_081137_drop_works_short_description',
  },
  {
    up: migration_20260920_123826_move_contact_cta_to_footer.up,
    down: migration_20260920_123826_move_contact_cta_to_footer.down,
    name: '20260920_123826_move_contact_cta_to_footer',
  },
  {
    up: migration_20260920_123832_add_works_feature_visual.up,
    down: migration_20260920_123832_add_works_feature_visual.down,
    name: '20260920_123832_add_works_feature_visual',
  },
  {
    up: migration_20260922_194500_add_object_key_and_password_request_at.up,
    down: migration_20260922_194500_add_object_key_and_password_request_at.down,
    name: '20260922_194500_add_object_key_and_password_request_at',
  },
  {
    up: migration_20260922_211800_add_asset_size_variants.up,
    down: migration_20260922_211800_add_asset_size_variants.down,
    name: '20260922_211800_add_asset_size_variants',
  },
  {
    up: migration_20260922_223608_drop_unused_fields_and_restore_size_indexes.up,
    down: migration_20260922_223608_drop_unused_fields_and_restore_size_indexes.down,
    name: '20260922_223608_drop_unused_fields_and_restore_size_indexes',
  },
  {
    up: migration_20260925_131216_add_landing_page_cms_copy.up,
    down: migration_20260925_131216_add_landing_page_cms_copy.down,
    name: '20260925_131216_add_landing_page_cms_copy',
  },
  {
    up: migration_20260925_143828_add_footer_social_platforms_and_secondary_cta.up,
    down: migration_20260925_143828_add_footer_social_platforms_and_secondary_cta.down,
    name: '20260925_143828_add_footer_social_platforms_and_secondary_cta',
  },
  {
    up: migration_20260925_143835_add_work_description.up,
    down: migration_20260925_143835_add_work_description.down,
    name: '20260925_143835_add_work_description',
  },
  {
    up: migration_20260925_144930_add_text_item_vertical_alignment.up,
    down: migration_20260925_144930_add_text_item_vertical_alignment.down,
    name: '20260925_144930_add_text_item_vertical_alignment'
  },
];
