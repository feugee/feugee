import type { CollectionConfig } from "payload";

import { publishedRead } from "../access/publishedRead";
import { layoutBlocks } from "../blocks/layouts";
import {
  revalidateWorkAfterChange,
  revalidateWorkAfterDelete,
} from "../hooks/revalidateSite";
import { slugField } from "../utilities/slug";

export const Works: CollectionConfig = {
  slug: "works",
  labels: {
    singular: "Work",
    plural: "Works",
  },
  orderable: true,
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "sector", "_status"],
    livePreview: {
      // The preview route renders drafts for authenticated CMS sessions
      // only — the public Detail Page is static and cannot. Being dynamic
      // and auth-gated, the route mounts its Live Preview machinery
      // unconditionally; no anonymous visitor ever loads it.
      url: ({ data }) => {
        if (typeof data.slug === "string" && data.slug.length > 0) {
          return `/works/${data.slug}/preview`;
        }
        return undefined;
      },
      breakpoints: [
        { label: "Mobile", name: "mobile", width: 375, height: 667 },
        { label: "Tablet", name: "tablet", width: 768, height: 1024 },
      ],
    },
  },
  access: {
    read: publishedRead,
  },
  hooks: {
    afterChange: [revalidateWorkAfterChange],
    afterDelete: [revalidateWorkAfterDelete],
  },
  versions: {
    drafts: {
      autosave: true,
    },
    maxPerDoc: 50,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    slugField("title"),
    {
      name: "subtitle",
      type: "text",
    },
    {
      name: "description",
      type: "richText",
      admin: {
        description:
          "The Work's summary prose, shown as the Overview block on the Work Detail Page.",
      },
    },
    {
      name: "descriptionLabel",
      type: "text",
      defaultValue: "Overview",
      admin: {
        description:
          "The heading above the Description on the Work Detail Page. Empty shows the Description with no heading.",
      },
    },
    {
      name: "thumbnail",
      type: "upload",
      relationTo: "assets",
      admin: {
        description: "The primary visual for this Work, shown at the top of the Work Detail Page.",
      },
    },
    {
      name: "featureVisual",
      type: "upload",
      relationTo: "assets",
      admin: {
        description:
          "Shown in place of the Thumbnail as this Work's card in the Landing Page's Selected Works. Image or video. Falls back to the Thumbnail when empty.",
      },
    },
    {
      name: "client",
      type: "text",
    },
    {
      name: "sector",
      type: "relationship",
      relationTo: "sectors",
    },
    {
      name: "year",
      type: "number",
      min: 1990,
      max: new Date().getFullYear(),
      admin: {
        description: "Year the Work was produced or released.",
      },
    },
    {
      name: "associate",
      type: "text",
      admin: {
        description: "The project lead responsible for this Work.",
      },
    },
    {
      name: "expertise",
      type: "text",
      hasMany: true,
    },
    {
      name: "projectTeam",
      type: "text",
      hasMany: true,
      admin: {
        description: "Feugee's own staff credited on this Work.",
      },
    },
    {
      name: "collaborators",
      type: "text",
      hasMany: true,
      admin: {
        description: "People outside Feugee credited on this Work.",
      },
    },
    {
      name: "testimonials",
      type: "array",
      labels: {
        singular: "Testimonial",
        plural: "Testimonials",
      },
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
        },
        {
          name: "job",
          type: "text",
        },
        {
          name: "company",
          type: "text",
        },
        {
          name: "testimony",
          type: "textarea",
          required: true,
        },
      ],
    },
    {
      name: "sections",
      type: "array",
      labels: {
        singular: "Section",
        plural: "Sections",
      },
      admin: {
        description: "The content of the Work Detail Page, in sidebar order.",
      },
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "layouts",
          type: "blocks",
          labels: {
            singular: "Layout",
            plural: "Layouts",
          },
          blocks: layoutBlocks,
          minRows: 1,
        },
      ],
    },
  ],
};
