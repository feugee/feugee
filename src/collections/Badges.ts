import type { CollectionConfig } from "payload";

import { colorField } from "../fields/color";
import {
  revalidateSiteAfterChange,
  revalidateSiteAfterDelete,
} from "../hooks/revalidateSite";

export const Badges: CollectionConfig = {
  slug: "badges",
  labels: {
    singular: "Badge",
    plural: "Badges",
  },
  admin: {
    useAsTitle: "name",
    description:
      "Short markers Works can wear on their Works Page card and at the right of their Work Detail Page — one per Work. Renaming or recoloring a Badge updates every Work wearing it.",
    defaultColumns: ["name", "icon", "color"],
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [revalidateSiteAfterChange],
    afterDelete: [revalidateSiteAfterDelete],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      admin: {
        description:
          "The Badge's meaning — shown beside the icon on the Work Card's ribbon (revealed on hover on desktop, always shown on phone and tablet) and pinned open at the right of the Work Detail Page; doubles as the icon's screen-reader label.",
      },
    },
    {
      name: "icon",
      type: "upload",
      relationTo: "assets",
      required: true,
      filterOptions: () => ({ mimeType: { like: "image/" } }),
      admin: {
        description:
          "Image only — SVG or transparent PNG especially. The icon shows as-is on the Badge's colored ribbon on the Work Card, so pick artwork that reads on the color.",
      },
    },
    colorField({
      name: "color",
      required: true,
      // The Badge's out-of-the-box fill is the site's primary orange.
      defaultValue: "#F2631C",
      description:
        "The Work Card ribbon's fill behind the icon and the white name text — pick a color both read on.",
    }),
  ],
};
