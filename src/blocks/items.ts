import type { Block } from "payload"

export const titleItem: Block = {
  slug: "title",
  labels: { singular: "Title", plural: "Titles" },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
  ],
}

export const titledTextItem: Block = {
  slug: "titled-text",
  labels: { singular: "Titled Text", plural: "Titled Text" },
  fields: [
    {
      name: "entries",
      type: "array",
      labels: { singular: "Entry", plural: "Entries" },
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "text",
          type: "richText",
          required: true,
        },
      ],
    },
  ],
}

export const textItem: Block = {
  slug: "text",
  labels: { singular: "Text", plural: "Text" },
  fields: [
    {
      name: "verticalAlignment",
      type: "select",
      defaultValue: "bottom",
      options: [
        { label: "Top", value: "top" },
        { label: "Center", value: "center" },
        { label: "Bottom", value: "bottom" },
      ],
      admin: {
        description:
          "Where the text sits in its cell when the cell is taller than the text.",
      },
    },
    {
      name: "entries",
      type: "array",
      labels: { singular: "Entry", plural: "Entries" },
      fields: [
        {
          name: "text",
          type: "richText",
          required: true,
        },
      ],
    },
  ],
}

export const assetItem: Block = {
  slug: "asset",
  labels: { singular: "Asset", plural: "Assets" },
  fields: [
    {
      name: "asset",
      type: "upload",
      relationTo: "assets",
      required: true,
    },
  ],
}
