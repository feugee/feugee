"use client";

import { lazy, Suspense, useMemo } from "react";

import type { LandingPage } from "@/payload-types";

import { ClientMarquee, type MarqueeClient } from "@/components/ClientMarquee";
import { HeroSlider, type HeroSlide } from "@/components/HeroSlider";
import { usePreviewRequested } from "@/components/live-preview/usePreviewRequested";
import { WhoWeAreSection } from "@/components/who-we-are/WhoWeAreSection";
import { SelectedWorksSection } from "@/components/selected-works/SelectedWorksSection";
import {
  TestimonialsSection,
  type TestimonialItem,
} from "@/components/testimonials/TestimonialsSection";
import { populatedAssetOf, sizedUrlOf, videoPosterOf } from "@/components/work";
import {
  DEFAULT_CLIENTS_HEADING,
  DEFAULT_SELECTED_WORKS_HEADING,
  landingHeadingOf,
} from "@/components/landingHeadings";
import { heroLeadInOf, normalizeRotatingWords } from "@/components/heroTitle";
import { resolveScrollCue } from "@/components/scrollCue";

// The Live Preview machinery rides a lazy chunk: it only downloads inside
// the CMS Dashboard's preview iframe, where the gate below has seen
// ?livePreview=landing-page. Anonymous visitors get the static page and
// none of this code.
const LandingPageLivePreview = lazy(() => import("./LandingPageLivePreview"));

export const LandingPageView = ({
  clients,
  initialData,
}: {
  clients: MarqueeClient[];
  initialData: LandingPage;
}) => {
  const livePreview = usePreviewRequested("landing-page");
  const content = <LandingPageContent clients={clients} data={initialData} />;

  if (!livePreview) return content;

  // The static content doubles as the Suspense fallback, so the swap to the
  // live view is seamless while the chunk loads.
  return (
    <Suspense fallback={content}>
      <LandingPageLivePreview clients={clients} initialData={initialData} />
    </Suspense>
  );
};

export const LandingPageContent = ({
  clients,
  data,
}: {
  clients: MarqueeClient[];
  data: LandingPage;
}) => {
  // Each slide is a Video Source group: an uploaded video Asset or an
  // Embedded Video. Either can be mid-edit shallow (a bare ID, an embed
  // without its derived video ID) — the slide drops out until it resolves,
  // like a half-uploaded one always has. Slides are full-bleed, so their
  // posters request the wide variant.
  const slides = useMemo<HeroSlide[]>(
    () =>
      (data.hero?.slides ?? []).flatMap((slide): HeroSlide[] => {
        const video = slide.video;
        if (typeof video !== "object" || video === null) return [];

        if (video.source === "embed") {
          const embed = video.embed;
          const videoId = embed?.videoId;
          if (
            !embed ||
            embed.provider !== "youtube" ||
            typeof videoId !== "string" ||
            videoId === ""
          ) {
            return [];
          }
          const poster = populatedAssetOf(embed.poster);
          return [
            {
              id: slide.id ?? "",
              video: { type: "youtube", videoId },
              posterUrl: poster ? sizedUrlOf(poster, "wide") : null,
              alt: embed.alt?.trim() || `YouTube video ${videoId}`,
            },
          ];
        }

        const asset = video.asset;
        if (typeof asset !== "object" || asset === null) return [];
        if (typeof asset.url !== "string") return [];
        const poster = videoPosterOf(asset);
        return [
          {
            id: slide.id ?? "",
            video: { type: "file", url: asset.url },
            posterUrl: poster ? sizedUrlOf(poster, "wide") : null,
            alt: asset.alt,
          },
        ];
      }),
    [data],
  );

  // The visible Hero title doubles as the page's h1; without slides the Hero
  // stays hidden and the title falls back to this sr-only h1 below.
  const heroTitle = data.hero?.title?.trim() || "Feugee";

  // Blank words are a mid-edit Live Preview state — dropped until they
  // resolve, like a half-uploaded hero slide.
  const rotatingWords = useMemo(
    () => normalizeRotatingWords(data.hero?.rotatingWords),
    [data],
  );

  // Blank CMS fields fall back to the defaults the fields seed with: the
  // Lead-In Word, both section headings, and the Scroll Cue's label.
  const leadInWord = heroLeadInOf(data.hero?.leadInWord);
  const cue = resolveScrollCue(data.hero?.scrollCue);
  const clientsHeading = landingHeadingOf(
    data.clientsHeading,
    DEFAULT_CLIENTS_HEADING,
  );
  const selectedWorksHeading = landingHeadingOf(
    data.selectedWorksHeading,
    DEFAULT_SELECTED_WORKS_HEADING,
  );

  const heading = data.whoWeAre?.heading?.trim() || "Who We Are";
  const description = data.whoWeAre?.description?.trim() || null;
  const stats = data.stats ?? [];
  const showAbout = description !== null || stats.length > 0;

  // Rows missing their required text are a mid-edit Live Preview state —
  // left out until they resolve, like a half-uploaded hero slide.
  const testimonialItems = useMemo<TestimonialItem[]>(
    () =>
      (data.testimonials?.items ?? []).flatMap((item) => {
        const name = item.name?.trim();
        const testimony = item.testimony?.trim();
        if (!name || !testimony) return [];
        return [
          {
            id: item.id ?? null,
            name,
            job: item.job?.trim() || null,
            company: item.company?.trim() || null,
            testimony,
          },
        ];
      }),
    [data],
  );

  return (
    <div className="flex flex-1 flex-col">
      {slides.length > 0 ? (
        <HeroSlider
          cue={cue}
          leadInWord={leadInWord}
          rotatingWords={rotatingWords}
          slides={slides}
          title={heroTitle}
        />
      ) : (
        <h1 className="sr-only">{heroTitle}</h1>
      )}

      {showAbout && (
        <WhoWeAreSection
          description={description}
          heading={heading}
          stats={data.stats}
        />
      )}

      {clients.length > 0 && (
        <ClientMarquee clients={clients} heading={clientsHeading} />
      )}

      <SelectedWorksSection heading={selectedWorksHeading} works={data.selectedWorks} />

      {testimonialItems.length > 0 && (
        <TestimonialsSection
          description={data.testimonials?.description?.trim() || null}
          heading={data.testimonials?.heading?.trim() || "Testimonials"}
          items={testimonialItems}
        />
      )}
    </div>
  );
};
