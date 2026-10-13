import type { Field, GlobalConfig } from "payload";
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
} from "@payloadcms/plugin-seo/fields";

import { publishedRead } from "../access/publishedRead";
import { revalidateGlobalAfterChange } from "../hooks/revalidateSite";

/**
 * The SEO field set for one page, namespaced under `name` — the plugin's
 * fields used directly (its collections/globals injection appends exactly
 * one `meta` group, and this global needs two). Empty fields resolve on the
 * public site to the page's derived defaults, so nothing here is required.
 *
 * No generate buttons: the derived defaults come from other documents (the
 * Hero, the Footer, the Works), which this global's own generate endpoint
 * cannot see.
 */
const seoGroupOf = (name: "landingPage" | "worksPage"): Field => ({
  type: "group",
  name,
  label: "SEO",
  fields: [
    OverviewField({
      titlePath: `${name}.title`,
      descriptionPath: `${name}.description`,
      imagePath: `${name}.image`,
    }),
    MetaTitleField({}),
    MetaDescriptionField({}),
    MetaImageField({
      relationTo: "assets",
      overrides: {
        filterOptions: () => ({ mimeType: { like: "image/" } }),
      },
    }),
  ],
});

export const SEO: GlobalConfig = {
  slug: "seo",
  label: "SEO",
  admin: {
    description:
      "How the Landing Page and the Works Page preview when their links are shared, plus the site-wide Share Image every shared link falls back to.",
  },
  access: {
    read: publishedRead,
  },
  hooks: {
    afterChange: [revalidateGlobalAfterChange],
  },
  versions: {
    drafts: {
      autosave: true,
    },
    max: 50,
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        { label: "Landing Page", fields: [seoGroupOf("landingPage")] },
        { label: "Works Page", fields: [seoGroupOf("worksPage")] },
      ],
    },
    {
      name: "shareImage",
      type: "upload",
      relationTo: "assets",
      required: true,
      filterOptions: () => ({ mimeType: { like: "image/" } }),
      admin: {
        position: "sidebar",
        description:
          "The site-wide Share Image (CONTEXT.md) — a shared link previews with it when the page offers no image of its own. Purpose-built JPEG or PNG, about 1200×630.",
      },
    },
  ],
};
