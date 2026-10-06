import configPromise from "@payload-config";
import type { Metadata } from "next";
import { cache } from "react";
import { getPayload } from "payload";

import type { Sector, Work } from "@/payload-types";

import { toCardWork, workThumbnailOf, asWorkSelect, listingWorksSelect } from "@/components/work";
import { getFooterGlobal } from "@/components/footer-data";
import { type OgImage, videoSourceOgOf } from "@/seo/ogImage";
import { pageMetadata } from "@/seo/metadata";
import { BackToTop } from "./BackToTop";
import {
  WorksListing,
  type CardBadge,
  type SectorOption,
  type WorksListItem,
} from "./WorksListing";

// Below this many published Works the page reads as short: the Filter Works
// block stays hidden and the page just lists everything — and the Back to
// Top control stays hidden with it.
const LONG_LIST_THRESHOLD = 15;

const sectorSlugOf = (
  sector: Work["sector"] | Sector,
): string | null =>
  typeof sector === "object" && sector !== null
    ? sector.slug ?? String(sector.id)
    : null;

// The ribbon renders only a whole Badge — a bare relationship id, or an icon
// Asset without a URL, leaves the card unchanged.
const badgeOf = (badge: Work["badge"]): CardBadge | null => {
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

// The card guards live in toCardWork; this adds only what the Works Page's
// masonry cards display. Its published check is belt-and-braces — the query
// above already filters to published Works. Cards are full-width below lg
// and one of two content columns above — the tablet variant covers both.
const toListItem = (work: Work): WorksListItem | null => {
  const card = toCardWork(work, workThumbnailOf(work, "tablet"));
  if (card === null) return null;

  return {
    ...card,
    firstExpertise: work.expertise?.[0] ?? null,
    sectorSlug: sectorSlugOf(work.sector),
    badge: badgeOf(work.badge),
  };
};

// The page renders statically — revalidated by the Works and Sectors hooks —
// so the ?sector= filter is seeded client-side inside WorksListing rather
// than from request search params.
const getWorksPageData = cache(
  async (): Promise<{
    items: WorksListItem[];
    sectorOptions: SectorOption[];
    showFilter: boolean;
    showBackToTop: boolean;
    ogImage: OgImage | null;
  }> => {
    const payload = await getPayload({ config: configPromise });
    // Orderable collections default to `_order` ascending — the CMS's manual
    // order. The `_status` guard is belt-and-braces: docs seeded straight into
    // the parent table with `_status: "draft"` would otherwise slip past
    // draft:false, which only excludes docs without a parent row. The select
    // keeps the docs to the masonry's card fields — no detail-page Sections.
    const [worksResult, sectorsResult] = await Promise.all([
      payload.find({
        collection: "works",
        // Depth 2 populates the thumbnail Asset and, in turn, its poster.
        depth: 2,
        draft: false,
        limit: 0,
        where: { _status: { equals: "published" } },
        select: asWorkSelect(listingWorksSelect),
      }),
      payload.find({
        collection: "sectors",
        draft: false,
        limit: 0,
        sort: "id",
      }),
    ]);

    const items = worksResult.docs
      .map(toListItem)
      .filter((item): item is WorksListItem => item !== null);

    // Only sectors that actually surface a Work become filters — dead entries
    // that empty the grid are worse than a shorter list.
    const usedSectorSlugs = new Set(
      items.map((item) => item.sectorSlug).filter((slug) => slug !== null),
    );
    const sectorOptions: SectorOption[] = sectorsResult.docs.flatMap(
      (sector) => {
        const slug = sectorSlugOf(sector);
        return slug !== null && usedSectorSlugs.has(slug)
          ? [{ name: sector.name, slug }]
          : [];
      },
    );

    // The listing's share face is its first Work's — the page is nothing but
    // the Works. Desktop-sized, straight off the raw docs (the card items
    // request the tablet variant for their tighter slots).
    const ogImage =
      worksResult.docs
        .map((work) => videoSourceOgOf(work.thumbnail))
        .find((image): image is OgImage => image !== null) ?? null;

    // One verdict admits both long-list features; the filter still needs
    // Sectors to show, client-side, while the Back to Top control doesn't.
    const longList = worksResult.docs.length > LONG_LIST_THRESHOLD;

    return {
      items,
      sectorOptions,
      showFilter: longList,
      showBackToTop: longList,
      ogImage,
    };
  },
);

export default async function Page() {
  const { items, sectorOptions, showFilter, showBackToTop } =
    await getWorksPageData();

  return (
    <>
      <WorksListing
        items={items}
        sectorOptions={sectorOptions}
        showFilter={showFilter}
      />
      {showBackToTop && <BackToTop />}
    </>
  );
}

export const generateMetadata = async (): Promise<Metadata> => {
  const [{ ogImage }, footer] = await Promise.all([
    getWorksPageData(),
    getFooterGlobal(),
  ]);

  return pageMetadata({
    title: "Our Works — Feugee",
    // The listing has no CMS copy of its own; the About blurb is the
    // agency-managed site description. getFooterGlobal is the layout's own
    // request-cached read — no extra query.
    description: footer?.about?.description,
    url: "/works",
    image: ogImage,
  });
};
