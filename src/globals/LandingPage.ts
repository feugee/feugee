import type { GlobalConfig } from "payload"

import { publishedRead } from "../access/publishedRead"
import { revalidateGlobalAfterChange } from "../hooks/revalidateSite"

export const LandingPage: GlobalConfig = {
  slug: "landing-page",
  label: "Landing Page",
  admin: {
    description: "The content of the site's front page, section by section.",
    livePreview: {
      // The flag arms the Landing Page's Live Preview client code on an
      // otherwise static route — anonymous visitors load none of it.
      url: "/?livePreview=landing-page",
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
      name: "hero",
      label: "Hero",
      admin: {
        description:
          "The full-screen opening: the title and its rotating words over a slider of videos.",
      },
      fields: [
        {
          name: "title",
          type: "text",
        },
        {
          name: "subtitle",
          type: "text",
        },
        {
          name: "leadInWord",
          type: "text",
          defaultValue: "Into",
          admin: {
            description:
              'The fixed opening word of the title\'s second line — "Into" by default.',
          },
        },
        {
          type: "group",
          name: "scrollCue",
          label: "Scroll Cue",
          admin: {
            description:
              "The button in the Hero's bottom-right. Without a URL it scrolls to the content below the Hero; without a label it does not render.",
          },
          fields: [
            {
              name: "label",
              type: "text",
              defaultValue: "Scroll to explore",
            },
            {
              name: "url",
              type: "text",
              admin: {
                description:
                  "Internal path or external URL. Leave empty to scroll to the content below the Hero.",
              },
            },
          ],
        },
        {
          name: "rotatingWords",
          type: "array",
          labels: {
            singular: "Rotating Word",
            plural: "Rotating Words",
          },
          minRows: 1,
          admin: {
            description:
              "The words that cycle as the title's last word, in order. A single word renders statically.",
          },
          fields: [
            {
              name: "word",
              type: "text",
              required: true,
            },
          ],
        },
        {
          name: "slides",
          type: "array",
          labels: {
            singular: "Slide",
            plural: "Slides",
          },
          minRows: 1,
          fields: [
            {
              name: "video",
              type: "upload",
              relationTo: "assets",
              required: true,
              filterOptions: () => ({ mimeType: { like: "video/" } }),
              admin: {
                description:
                  "Video only. Set the poster on the Asset itself — it is the slide's preview frame.",
              },
            },
          ],
        },
      ],
    },
    {
      type: "group",
      name: "whoWeAre",
      label: "Who We Are",
      fields: [
        {
          name: "heading",
          type: "text",
          defaultValue: "Who We Are",
        },
        {
          name: "description",
          type: "textarea",
        },
      ],
    },
    {
      name: "stats",
      type: "array",
      labels: {
        singular: "Stat",
        plural: "Stats",
      },
      admin: {
        description: "Proof figures shown together — e.g. 55+ / Videos.",
      },
      fields: [
        {
          name: "value",
          type: "text",
          required: true,
          admin: {
            description: 'The figure — e.g. "55+" or "35+M".',
          },
        },
        {
          name: "label",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "clientsHeading",
      type: "text",
      defaultValue: "Clients Ideas We've Visualized",
      admin: {
        description: "The heading above the Client Marquee.",
      },
    },
    {
      name: "selectedWorks",
      type: "relationship",
      relationTo: "works",
      hasMany: true,
      filterOptions: () => ({ _status: { equals: "published" } }),
      admin: {
        description: "Works featured on the Landing Page, in display order.",
      },
    },
    {
      name: "selectedWorksHeading",
      type: "text",
      defaultValue: "Selected Works",
      admin: {
        description: "The heading above the Selected Works.",
      },
    },
    {
      type: "group",
      name: "testimonials",
      label: "Testimonials",
      admin: {
        description:
          "Endorsements of the agency, shown below Selected Works in two counter-scrolling columns.",
      },
      fields: [
        {
          name: "heading",
          type: "text",
          defaultValue: "Testimonials",
        },
        {
          name: "description",
          type: "textarea",
        },
        {
          name: "items",
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
      ],
    },
  ],
}
