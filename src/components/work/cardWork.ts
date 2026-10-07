import type { Work } from "@/payload-types";

import { populatedAssetOf, workThumbnailOf, type CardVisual } from "./visual";

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
  /** The Client Logo (CONTEXT.md) Asset's URL for the Cursor, or null when
   * the field is empty, a bare relationship id (mid-edit Live Preview), or
   * an Asset without a usable URL. The Cursor sizes the logo's box itself,
   * so no dimensions ride along. */
  clientLogo: string | null;
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
        ? logo.url
        : null,
  };
};
