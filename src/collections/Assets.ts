import type { CollectionConfig } from "payload"

import {
  revalidateSiteAfterChange,
  revalidateSiteAfterDelete,
} from "../hooks/revalidateSite"
import {
  assetUploadLimitBytes,
  describeSize,
  uploadSizeError,
} from "./assetUploadCap"

export const Assets: CollectionConfig = {
  slug: "assets",
  labels: {
    singular: "Asset",
    plural: "Assets",
  },
  admin: {
    useAsTitle: "filename",
    description: `Images and videos referenced by site content. Up to ${describeSize(assetUploadLimitBytes)} each.`,
  },
  access: {
    read: () => true,
  },
  upload: {
    mimeTypes: ["image/*", "video/*"],
    modifyResponseHeaders: ({ headers }) => {
      headers.set("Cache-Control", "public, max-age=31536000, immutable")
      return headers
    },
    // The size ladder every public placement requests from, smallest to
    // largest: Footer cards and marquee logos (thumbnail), the Works
    // masonry and multi-column Work items (tablet), one-column Work items
    // (desktop), and full-bleed surfaces — Selected Works cards, the Hero
    // Slider's posters, the Work Detail hero (wide). Payload skips a size
    // when the original is narrower than it, so a small original never
    // gains upscaled variants; placements fall back down the ladder at
    // render time. Videos and SVGs get no variants (sharp does not resize
    // them); a video's poster is a separate image Asset and is sized like
    // any other.
    imageSizes: [
      {
        name: "thumbnail",
        width: 640,
        formatOptions: { format: "webp", options: { quality: 80 } },
      },
      {
        name: "tablet",
        width: 1024,
        formatOptions: { format: "webp", options: { quality: 80 } },
      },
      {
        name: "desktop",
        width: 1600,
        formatOptions: { format: "webp", options: { quality: 80 } },
      },
      {
        name: "wide",
        width: 2400,
        formatOptions: { format: "webp", options: { quality: 80 } },
      },
    ],
    adminThumbnail: "thumbnail",
  },
  hooks: {
    beforeValidate: [
      ({ req }) => {
        const error = uploadSizeError(req.file?.size)
        if (error) {
          throw error
        }
      },
    ],
    afterChange: [revalidateSiteAfterChange],
    afterDelete: [revalidateSiteAfterDelete],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      admin: {
        description:
          "Describes the image or video for screen readers and search engines.",
      },
    },
    {
      name: "poster",
      type: "upload",
      relationTo: "assets",
      // Payload stores no dimensions for videos, so the poster image is the
      // only thing that can hold the video's aspect ratio — grids and masonry
      // read it from the poster instead of the video itself.
      filterOptions: () => ({ mimeType: { like: "image/" } }),
      admin: {
        condition: (data) =>
          typeof data?.mimeType === "string" &&
          data.mimeType.startsWith("video/"),
        description:
          "Image shown before the video plays. Pick one with the same frame size as the video — it fixes the video's slot in grids and the masonry.",
      },
    },
  ],
}
