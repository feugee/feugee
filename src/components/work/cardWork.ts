import type { Work } from "@/payload-types";

import { populatedAssetOf, workThumbnailOf, type CardVisual } from "./visual";

/**
 * A Work's Client Logo (CONTEXT.md) resolved to what the Cursor consumes:
 * the URL and the intrinsic dimensions that size the logo's box before the
 * file itself has loaded.
 */
export type CardClientLogo = {
  url: string;
  width: number;
  height: number;
};

/**
 * The [data-cursor-logo] payload — "url width height", the srcset descriptor
 * shape. The Cursor parses the intrinsic ratio out of it to size the logo's
 * box from the attributes alone, no load required.
 */
export const clientLogoAttrOf = (
  logo: CardClientLogo | null,
): string | undefined =>
  logo ? `${logo.url} ${logo.width} ${logo.height}` : undefined;

/**
 * The core of every Work card surface — exactly the fields a card needs
 * before a page adds its own (Selected Works adds year, the Footer adds
 * subtitle, …). Surfaces spread this and read their extras off the
 * original Work.
 */
export type CardWork = {
  id: number;
  slug: string;
  title: string;
  visual: CardVisual;
  clientLogo: CardClientLogo | null;
};

/**
 * The one place that decides whether a Work can ride a card surface:
 * published, populated deep enough to have a usable visual, and that visual
 * resolved to its render-ready union. Every guard a card needs, behind one
 * call — surfaces stop re-deriving them.
 *
 * The card's visual is the Work's Thumbnail unless the caller passes a
 * preferred one — Selected Works passes its Feature Visual, which wins only
 * when usable.
 *
 * A bare number (a shallow-populated relationship, mid-flight Live Preview
 * edit) is not a card; null is the caller's signal to drop it.
 */
export const toCardWork = (
  work: Work | number | null | undefined,
  visual?: CardVisual | null,
): CardWork | null => {
  if (typeof work !== "object" || work === null) return null;
  // Belt-and-braces: populated relationships can resolve docs that
  // draft:false would have excluded.
  if (work._status !== "published") return null;

  const resolved = visual ?? workThumbnailOf(work);
  if (resolved === null) return null;

  const logo = populatedAssetOf(work.clientLogo);
  return {
    id: work.id,
    slug: work.slug ?? "",
    title: work.title,
    visual: resolved,
    clientLogo:
      logo && typeof logo.url === "string" && logo.url.length > 0
        ? { url: logo.url, width: logo.width ?? 1, height: logo.height ?? 1 }
        : null,
  };
};
