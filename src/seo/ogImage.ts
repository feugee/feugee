import type { Asset, LandingPage } from "@/payload-types";

import {
  populatedAssetOf,
  sizedUrlOf,
  videoPosterOf,
  type AssetSizeName,
  type VideoSourceField,
} from "@/components/work";

/**
 * The social-share face of a page: an image URL plus whatever dimensions and
 * alt text the crawler needs to preview it. `url` may be relative — the root
 * layout's `metadataBase` composes it into an absolute one.
 */
export type OgImage = {
  url: string;
  width?: number;
  height?: number;
  alt: string;
};

// The size ladder's 1600-wide step — comfortably over the ~1200px the major
// crawlers want for a large card, without the wide variant's payload.
const OG_SIZE: AssetSizeName = "desktop";

const imageOg = (image: Asset): OgImage | null => {
  if (typeof image.url !== "string") return null;
  // sizedUrlOf degrades through the ladder to the original on its own.
  const url = sizedUrlOf(image, OG_SIZE) ?? image.url;

  return {
    url,
    ...(image.width != null ? { width: image.width } : {}),
    ...(image.height != null ? { height: image.height } : {}),
    alt: image.alt,
  };
};

/**
 * An Asset as an OG image, or null when it can't serve as one. Video Assets
 * stand in via their Poster — crawlers don't play videos, and a posterless
 * video has no still face to offer.
 */
export const ogImageOf = (
  asset: Asset | number | null | undefined,
): OgImage | null => {
  if (typeof asset !== "object" || asset === null) return null;

  if (asset.mimeType?.startsWith("video/")) {
    const poster = videoPosterOf(asset);
    return poster === null ? null : imageOg(poster);
  }

  return imageOg(asset);
};

/**
 * The Hero's face for the Landing Page's OG image: the first Slide with a
 * poster to stand in for its video. The slides are videos by CMS filter, so
 * the poster walk is the whole story.
 */
export const heroOgImage = (hero: LandingPage["hero"]): OgImage | null => {
  for (const slide of hero?.slides ?? []) {
    const image = videoSourceOgOf(slide.video);
    if (image !== null) return image;
  }
  return null;
};

/**
 * A Video Source group's still face: the upload branch stands in via
 * ogImageOf (video Assets via their Poster), the embed branch via its
 * ingested poster. Crawlers don't play videos, and a posterless video —
 * uploaded or embedded — has no still face to offer.
 */
export const videoSourceOgOf = (
  source: VideoSourceField | null | undefined,
): OgImage | null => {
  if (source == null) return null;
  if (source.source === "embed") {
    const poster = populatedAssetOf(source.embed?.poster);
    return poster === null ? null : imageOg(poster);
  }
  return ogImageOf(source.asset);
};
