import configPromise from "@payload-config";
import type { Metadata } from "next";
import { cache } from "react";
import { getPayload, type Payload } from "payload";

import { publishedWhere } from "@/access/publishedRead";
import type { Asset, Client, LandingPage, Work } from "@/payload-types";

import type { MarqueeClient } from "@/components/ClientMarquee";
import {
  asAssetsSelect,
  asClientsSelect,
  asWorkSelect,
  cardAssetSelect,
  clientsSelect,
  selectedWorksSelect,
  sizedUrlOf,
} from "@/components/work";
import { heroOgImage } from "@/seo/ogImage";
import { pageMetadata } from "@/seo/metadata";
import { LandingPageView } from "./LandingPageView";

// A Client without a populated logo can't ride the marquee — drop it. Fallback
// dimensions cover logo formats Payload doesn't measure (SVG); the marquee
// fixes the height and lets the width follow. Raster logos request the
// thumbnail variant — the marquee renders them ~40px tall.
const toMarqueeClient = (client: Client): MarqueeClient | null => {
  if (
    typeof client.logo !== "object" ||
    client.logo === null ||
    typeof client.logo.url !== "string"
  ) {
    return null;
  }

  return {
    id: client.id,
    name: client.name,
    url: client.url ?? null,
    logo: {
      url: sizedUrlOf(client.logo, "thumbnail") ?? client.logo.url,
      alt: client.logo.alt,
      width: client.logo.width ?? 120,
      height: client.logo.height ?? 40,
    },
  };
};

// findGlobal's select cannot trim populated relationships — depth-populated
// docs come back whole — so the global is read at depth 0 (bare IDs) and its
// relationships rehydrated through card-select finds. The Selected Works
// never carry their detail-page Sections over the wire, and the hero videos
// none of their file metadata. The CMS's own order survives: both finds are
// keyed by ID and poured back in the global's sequence.
const rehydrateLandingPage = async (
  payload: Payload,
  landingPage: LandingPage,
): Promise<LandingPage> => {
  // A slide's Video Source group can reference Assets on either side of the
  // either/or — the upload itself, or the embed's ingested poster.
  const heroAssetIds = (landingPage.hero?.slides ?? []).flatMap((slide) => {
    const video = slide.video;
    if (typeof video !== "object" || video === null) return [];
    const ids = typeof video.asset === "number" ? [video.asset] : [];
    const posterId = video.embed?.poster;
    return typeof posterId === "number" ? [...ids, posterId] : ids;
  });
  const selectedWorkIds = (landingPage.selectedWorks ?? []).flatMap((work) =>
    typeof work === "number" ? [work] : [],
  );

  const [heroAssets, selectedWorks] = await Promise.all([
    heroAssetIds.length === 0
      ? { docs: [] as Asset[] }
      : payload.find({
          collection: "assets",
          // Depth 1 populates a video's poster.
          depth: 1,
          where: { id: { in: heroAssetIds } },
          select: asAssetsSelect(cardAssetSelect),
        }),
    selectedWorkIds.length === 0
      ? { docs: [] as Work[] }
      : payload.find({
          collection: "works",
          // Depth 2 populates the card visuals and, in turn, their posters.
          depth: 2,
          draft: false,
          limit: selectedWorkIds.length,
          where: { and: [{ id: { in: selectedWorkIds } }, publishedWhere] },
          select: asWorkSelect(selectedWorksSelect),
        }),
  ]);

  const assetById = new Map(heroAssets.docs.map((asset) => [asset.id, asset]));
  const workById = new Map(selectedWorks.docs.map((work) => [work.id, work]));

  // An ID the finds could not populate (a now-draft Work, a deleted Asset)
  // stays a number — the views drop it like a mid-edit Live Preview state.
  const hero = landingPage.hero
    ? {
        ...landingPage.hero,
        slides: (landingPage.hero.slides ?? []).map((slide) => {
          const video = slide.video;
          if (typeof video !== "object" || video === null) return slide;
          return {
            ...slide,
            video: {
              ...video,
              asset:
                typeof video.asset === "number"
                  ? (assetById.get(video.asset) ?? video.asset)
                  : video.asset,
              embed:
                video.embed && typeof video.embed.poster === "number"
                  ? {
                      ...video.embed,
                      poster:
                        assetById.get(video.embed.poster) ??
                        video.embed.poster,
                    }
                  : video.embed,
            },
          };
        }),
      }
    : landingPage.hero;

  return {
    ...landingPage,
    hero,
    selectedWorks: selectedWorkIds.map((id) => workById.get(id) ?? id),
  };
};

// The page renders statically; the Landing Page and Works hooks revalidate
// it when published CMS content changes.
const getLandingPageData = cache(async () => {
  const payload = await getPayload({ config: configPromise });

  // Clients is orderable — its default `_order` sort is the drag order set
  // in the CMS Dashboard.
  const [landingPage, clientsResult] = await Promise.all([
    payload.findGlobal({
      slug: "landing-page",
      draft: false,
      depth: 0,
    }),
    payload.find({
      collection: "clients",
      depth: 1,
      draft: false,
      limit: 0,
      select: asClientsSelect(clientsSelect),
    }),
  ]);

  const hydrated = await rehydrateLandingPage(payload, landingPage);
  const clients = clientsResult.docs
    .map(toMarqueeClient)
    .filter((client): client is MarqueeClient => client !== null);

  return { landingPage: hydrated, clients };
});

export default async function Page() {
  const { landingPage, clients } = await getLandingPageData();

  return <LandingPageView clients={clients} initialData={landingPage} />;
}

export const generateMetadata = async (): Promise<Metadata> => {
  const { landingPage } = await getLandingPageData();

  const heroTitle = landingPage.hero?.title?.trim();

  return pageMetadata({
    title: heroTitle ? `Feugee — ${heroTitle}` : "Feugee",
    description: landingPage.hero?.subtitle,
    url: "/",
    image: heroOgImage(landingPage.hero),
  });
};
