import type { Asset, Work } from "@/payload-types";

/**
 * The configured variant ladder on the Assets collection (see its
 * `imageSizes`): thumbnail 640, tablet 1024, desktop 1600, wide 2400.
 */
export type AssetSizeName = keyof NonNullable<Asset["sizes"]>;

/**
 * The URL of an Asset's variant for a size — the one every public placement
 * should request instead of the original file. Payload skips sizes wider
 * than a small original (and SVGs get none at all), so the pick falls back
 * to the widest variant that does exist and, failing that, to the original
 * url — never worse than the status quo, and dimensions for layout always
 * come from the Asset's own width/height elsewhere. Placements render the
 * picked URL with next/image's `unoptimized` — the optimizer would only
 * re-encode an already-sized variant.
 */
export const sizedUrlOf = (
  asset: Asset,
  size: AssetSizeName,
): string | null => {
  const entries = Object.values(asset.sizes ?? {}).filter(
    (entry): entry is NonNullable<NonNullable<Asset["sizes"]>[AssetSizeName]> =>
      entry != null,
  );
  const withUrl = entries.filter((entry) => entry.url != null);

  const requested = asset.sizes?.[size];
  if (requested?.url != null) return requested.url;

  // The requested variant is missing — either skipped (an original narrower
  // than the size gets no variant) or still unregenerated. When its width is
  // known, the smallest variant at least that wide is the closest stand-in;
  // otherwise (sizes are monotonic, so a skipped size has no wider siblings
  // either) the widest remaining variant is.
  const target = requested?.width;
  if (target != null) {
    const atLeast = withUrl
      .filter((entry) => (entry.width ?? 0) >= target)
      .sort((a, b) => (a.width ?? 0) - (b.width ?? 0));
    if (atLeast[0]?.url != null) return atLeast[0].url;
  }

  const widest = withUrl.reduce<(typeof withUrl)[number] | null>(
    (best, entry) =>
      (best?.width ?? 0) < (entry.width ?? 0) ? entry : best,
    null,
  );

  return widest?.url ?? asset.url ?? null;
};

/**
 * Video Assets carry no dimensions — Payload measures images only — so until
 * playback starts the poster image stands in for the video's size. Anything
 * laying out a video without a poster falls back to this aspect ratio.
 */
export const VIDEO_ASPECT_FALLBACK = { width: 16, height: 9 };

/**
 * A populated Asset, or null. Any relationship field can hold a bare ID (a
 * shallow populate, mid-flight Live Preview edit) — treat that as "not
 * usable yet" and let the caller fall back.
 */
export const populatedAssetOf = (
  value: Asset | number | null | undefined,
): Asset | null =>
  typeof value === "object" && value !== null ? value : null;

/**
 * The populated poster Asset of a video Asset, or null. The field can hold a
 * bare ID (shallow populate, mid-flight Live Preview edit) — treat that as
 * "no poster" and let the caller fall back.
 */
export const videoPosterOf = (asset: Asset): Asset | null =>
  populatedAssetOf(asset.poster);

/**
 * How a video plays: an uploaded file at its URL, or an embedded external
 * video by its provider video ID.
 */
export type CardVideoSource =
  | { type: "file"; url: string }
  | { type: "youtube"; videoId: string };

/**
 * A Work's visual — its Thumbnail or its Feature Visual — as a render-ready
 * discriminated union, or null when it is not usable (none set, or a
 * shallow-populated bare ID). Every card surface — Selected Works, the Works
 * Page masonry, the Footer — discriminates on this one shape instead of
 * re-deriving it.
 */
export type CardVisual =
  | {
      kind: "image";
      url: string;
      width: number;
      height: number;
      alt: string;
    }
  | {
      kind: "video";
      source: CardVideoSource;
      posterUrl: string | null;
      width: number;
      height: number;
      alt: string;
    };

const assetVisualOf = (
  asset: Asset | number | null | undefined,
  size?: AssetSizeName,
): CardVisual | null => {
  if (
    typeof asset !== "object" ||
    asset === null ||
    typeof asset.url !== "string"
  ) {
    return null;
  }

  const { url, alt } = asset;

  if (asset.mimeType?.startsWith("video/")) {
    const poster = videoPosterOf(asset);
    return {
      kind: "video",
      source: { type: "file", url },
      posterUrl: poster && size ? sizedUrlOf(poster, size) : (poster?.url ?? null),
      width: poster?.width ?? VIDEO_ASPECT_FALLBACK.width,
      height: poster?.height ?? VIDEO_ASPECT_FALLBACK.height,
      alt,
    };
  }

  return {
    kind: "image",
    url: size ? (sizedUrlOf(asset, size) ?? url) : url,
    width: asset.width ?? 1,
    height: asset.height ?? 1,
    alt,
  };
};

/**
 * The Video Source group's stored shape (CONTEXT.md) — the either/or every
 * video-consuming field presents. The generated types inline it per site
 * (Work Thumbnail/Feature Visual, a Hero Slide's video, an asset Item), all
 * identical, so it is named once here.
 */
export type VideoSourceField = NonNullable<Work["thumbnail"]>;

const embedVisualOf = (
  embed: NonNullable<VideoSourceField["embed"]>,
  size?: AssetSizeName,
): CardVisual | null => {
  const videoId = embed.videoId;
  if (embed.provider !== "youtube" || typeof videoId !== "string" || videoId === "") {
    return null;
  }
  const poster = populatedAssetOf(embed.poster);
  return {
    kind: "video",
    source: { type: "youtube", videoId },
    posterUrl:
      poster === null
        ? null
        : ((size ? sizedUrlOf(poster, size) : null) ??
          poster.url ??
          null),
    width: poster?.width ?? VIDEO_ASPECT_FALLBACK.width,
    height: poster?.height ?? VIDEO_ASPECT_FALLBACK.height,
    alt: embed.alt?.trim() || `YouTube video ${videoId}`,
  };
};

/**
 * A Video Source group as a render-ready CardVisual — the one resolver for
 * both sides of the either/or. A group still mid-edit (an unpopulated
 * upload, an embed without its derived video ID) resolves to null and the
 * caller drops it like any unusable visual.
 */
export const videoSourceVisualOf = (
  source: VideoSourceField | null | undefined,
  size?: AssetSizeName,
): CardVisual | null => {
  if (source == null) return null;
  if (source.source === "embed") {
    return source.embed ? embedVisualOf(source.embed, size) : null;
  }
  return assetVisualOf(source.asset, size);
};

/** A Work's Thumbnail as a render-ready CardVisual, or null when unusable. */
export const workThumbnailOf = (
  work: Work,
  size?: AssetSizeName,
): CardVisual | null => videoSourceVisualOf(work.thumbnail, size);

/** A Work's Feature Visual as a render-ready CardVisual, or null when unusable. */
export const workFeatureVisualOf = (
  work: Work,
  size?: AssetSizeName,
): CardVisual | null => videoSourceVisualOf(work.featureVisual, size);
