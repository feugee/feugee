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
      "Short markers Works can wear on their Works Page card — one per Work. Renaming or recoloring a Badge updates every Work wearing it.",
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
          "The Badge's meaning — the chip's screen-reader label and hover tooltip on the Work Card.",
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
          "Image only — SVG or transparent PNG especially. The icon shows as-is inside the Badge's colored chip on the Work Card, so pick artwork that reads on the color.",
      },
    },
    colorField({
      name: "color",
      required: true,
      // The chip's out-of-the-box fill is the site's primary orange.
      defaultValue: "#F2631C",
      description: "The chip's fill behind the icon on the Work Card.",
    }),
  ],
};
