import type { GlobalConfig } from "payload"

import { publishedRead } from "../access/publishedRead"
import { revalidateGlobalAfterChange } from "../hooks/revalidateSite"
import { socialPlatformOptions } from "../components/socialPlatforms"

// Site chrome rather than Landing Page content, so this lives on its own
// global — the (frontend) root layout mounts the Footer on every public page.
export const Footer: GlobalConfig = {
  slug: "footer",
  label: "Footer",
  admin: {
    description: "The content of the Footer at the bottom of every public page.",
    livePreview: {
      // The whole Landing Page loads in the iframe with this flag; only the
      // Footer's Live Preview client code arms itself for it.
      url: "/?livePreview=footer",
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
      type: "group",
      name: "cta",
      label: "Contact CTA",
      admin: {
        description:
          "The closing call-to-action at the top of the Footer: eyebrow, headline, body copy, and up to two buttons.",
      },
      fields: [
        {
          name: "eyebrow",
          type: "text",
          admin: {
            description: 'The small line above the headline — e.g. "Free 20-min intro call".',
          },
        },
        {
          name: "headline",
          type: "text",
        },
        {
          name: "body",
          type: "textarea",
        },
        {
          name: "actionLabel",
          type: "text",
          admin: {
            description: 'The button label — e.g. "Work with us".',
          },
        },
        {
          name: "actionUrl",
          type: "text",
          admin: {
            description:
              "Where the button points — internal path or external URL. Without it the button renders inert.",
          },
        },
        {
          name: "secondaryActionLabel",
          type: "text",
          admin: {
            description:
              'The second button\'s label — e.g. "See our works". The button renders only when this is filled.',
          },
        },
        {
          name: "secondaryActionUrl",
          type: "text",
          admin: {
            description:
              "Where the second button points. Without it the button renders inert, like the primary.",
          },
        },
      ],
    },
    {
      type: "group",
      name: "about",
      label: "About",
      fields: [
        {
          name: "heading",
          type: "text",
          defaultValue: "About",
        },
        {
          name: "description",
          type: "textarea",
        },
      ],
    },
    {
      name: "otherWorksHeading",
      type: "text",
      defaultValue: "Other Works",
      admin: {
        description: "Heading above the Other Works cards.",
      },
    },
    {
      name: "otherWorks",
      type: "relationship",
      relationTo: "works",
      hasMany: true,
      filterOptions: () => ({ _status: { equals: "published" } }),
      admin: {
        description: "Works shown as cards beside the About blurb, in display order.",
      },
    },
    {
      name: "menuHeading",
      type: "text",
      defaultValue: "Menu",
      admin: {
        description: "Heading above the menu links.",
      },
    },
    {
      name: "menuLinks",
      type: "array",
      labels: {
        singular: "Menu Link",
        plural: "Menu Links",
      },
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
        },
        {
          name: "url",
          type: "text",
          required: true,
        },
      ],
    },
    {
      type: "group",
      name: "contact",
      label: "Contact",
      fields: [
        {
          name: "heading",
          type: "text",
          defaultValue: "Contact Us",
        },
        {
          name: "callToAction",
          type: "text",
          admin: {
            description: 'The call-to-action label — e.g. "Book a Call". Links out when a URL is set.',
          },
        },
        {
          name: "callToActionUrl",
          type: "text",
        },
        {
          name: "email",
          type: "email",
        },
        {
          name: "phone",
          type: "text",
        },
      ],
    },
    {
      name: "location",
      type: "text",
      admin: {
        description: "The pinned location label in the bottom bar.",
      },
    },
    {
      name: "socialLinks",
      type: "array",
      labels: {
        singular: "Social Link",
        plural: "Social Links",
      },
      admin: {
        description:
          "Social media profiles in the bottom bar — the platform picks the icon.",
      },
      fields: [
        {
          name: "platform",
          type: "select",
          // One vocabulary with the render icon map — the coherence test
          // keeps every selectable platform carrying an icon.
          options: [...socialPlatformOptions],
          required: true,
        },
        {
          name: "url",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "copyrightName",
      type: "text",
      defaultValue: "Feugee",
      admin: {
        description: "Who holds the copyright in the bottom bar — e.g. \"Feugee\".",
      },
    },
  ],
}
