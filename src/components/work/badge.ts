import type { Work } from "@/payload-types";

/**
 * A Badge resolved to exactly what a Badge surface renders — the icon
 * Asset's URL, the fill, and the name shown beside the icon. Born as the
 * Work Card's ribbon shape; the Work Detail Page renders the same shape
 * pinned open at the viewport's right edge.
 */
export interface CardBadge {
  name: string;
  color: string;
  iconUrl: string;
}

/**
 * The one place that decides whether a Work wears a Badge on a public
 * surface: only a whole Badge — name, color, and an icon Asset with a
 * usable URL — resolves. A bare relationship id (mid-edit Live Preview),
 * null, or an icon without a URL leaves the surface unchanged.
 */
export const badgeOf = (badge: Work["badge"]): CardBadge | null => {
  if (typeof badge !== "object" || badge === null) return null;
  const { name, color, icon } = badge;
  if (
    typeof name !== "string" ||
    typeof color !== "string" ||
    typeof icon !== "object" ||
    icon === null ||
    typeof icon.url !== "string"
  ) {
    return null;
  }
  return { name, color, iconUrl: icon.url };
};
