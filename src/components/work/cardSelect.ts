import type {
  AssetsSelect,
  ClientsSelect,
  WorksSelect,
} from "@/payload-types";

/**
 * Select shapes for the Work card surfaces — the field lists their queries
 * fetch instead of full depth-populated documents with detail-page Sections.
 *
 * The generated `*_select` types stop at relationship borders (a boolean per
 * relationship field), but the Local API accepts nested selects through
 * populated docs at runtime — collection `find` trims populated Works and
 * Assets to exactly these fields. The cast helpers at the bottom bridge that
 * typing gap; keep every field here one a card actually renders.
 */

/** Recursive select shape — mirrors what the Local API accepts. */
export type SelectShape = { [key: string]: boolean | SelectShape };

/**
 * The Asset fields every card visual, hero slide, and OG image consumes:
 * the URL and alt, the size ladder (sizedUrlOf), image dimensions (layout),
 * the video/poster discrimination, and the poster's own URL, dimensions,
 * and ladder (a video's aspect and preview frame live there). The filename
 * rides along because an upload's URL is derived from it — a direct find
 * on the assets collection that selects url without filename gets null
 * back, which would drop every hero slide and card visual.
 */
export const cardAssetSelect = {
  url: true,
  filename: true,
  alt: true,
  width: true,
  height: true,
  mimeType: true,
  sizes: true,
  poster: { url: true, width: true, height: true, sizes: true },
} satisfies SelectShape;

/**
 * The Video Source group's fields every card visual, hero slide, and OG
 * image consumes: which side of the either/or, the upload's own card fields,
 * and the embed's identity plus its ingested poster (a posterless embed
 * still plays — the 16:9 fallback sizes its slot).
 */
export const videoSourceSelect = {
  source: true,
  asset: cardAssetSelect,
  embed: {
    provider: true,
    url: true,
    alt: true,
    videoId: true,
    poster: { url: true, width: true, height: true, sizes: true },
  },
} satisfies SelectShape;

/** The card core plus the Year the Selected Works caption shows, with the
 *  Feature Visual that section prefers over the Thumbnail. */
export const selectedWorksSelect = {
  id: true,
  slug: true,
  title: true,
  year: true,
  _status: true,
  thumbnail: videoSourceSelect,
  featureVisual: videoSourceSelect,
} satisfies SelectShape;

/** The card core plus the Subtitle the Footer's Other Works cards show. */
export const otherWorksSelect = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  _status: true,
  thumbnail: videoSourceSelect,
} satisfies SelectShape;

/** The card core plus the Works Page masonry's filter facets. */
export const listingWorksSelect = {
  id: true,
  slug: true,
  title: true,
  _status: true,
  expertise: true,
  sector: { id: true, name: true, slug: true },
  thumbnail: videoSourceSelect,
} satisfies SelectShape;

/** The Client fields the marquee consumes — name, link, and a usable logo. */
export const clientsSelect = {
  id: true,
  name: true,
  url: true,
  logo: cardAssetSelect,
} satisfies SelectShape;

/** The cast that hands a nested select to a typed Local API call. */
export const asWorkSelect = (select: SelectShape): WorksSelect<true> =>
  select as unknown as WorksSelect<true>;

export const asClientsSelect = (select: SelectShape): ClientsSelect<true> =>
  select as unknown as ClientsSelect<true>;

export const asAssetsSelect = (select: SelectShape): AssetsSelect<true> =>
  select as unknown as AssetsSelect<true>;
