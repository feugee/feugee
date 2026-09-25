"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import type { Work } from "@/payload-types";

import { ArrowRight } from "@/components/ArrowRight";
import { AutoVideo } from "@/components/AutoVideo";
import { navigateWithBlackout } from "@/components/page-transition/navigateWithBlackout";
import { SectionHeading } from "@/components/SectionHeading";

import { clipInsetsFor, formatClipPath, type Rect } from "./captionClip";
import { MEDIA_OVERSHOOT, driftTravelPercent } from "./mediaDrift";
import { railActiveIndex, railArrowOffsetY } from "./railActiveIndex";
import { toSelectedWorkItem, type SelectedWorkItem } from "./selectedWorkItem";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const toRect = (rect: DOMRect): Rect => ({
  top: rect.top,
  right: rect.right,
  bottom: rect.bottom,
  left: rect.left,
});

const SelectedWorkCard = ({ item }: { item: SelectedWorkItem }) => (
  <Link
    className="relative block h-svh overflow-hidden"
    data-cursor="see-more"
    data-work-card
    href={`/works/${item.slug}`}
    onNavigate={(event) => navigateWithBlackout(event, `/works/${item.slug}`)}
  >
    {/* The drift track: taller than the card so it can travel while the
        card clips it. No-JS and reduced motion leave it top-flush — a
        static, fully covered frame. */}
    <div data-work-media style={{ height: `${MEDIA_OVERSHOOT * 100}%` }}>
      {item.visual.kind === "video" ? (
        <AutoVideo
          alt={item.visual.alt}
          className="h-full w-full object-cover"
          height={item.visual.height}
          poster={item.visual.posterUrl}
          src={item.visual.url}
          width={item.visual.width}
        />
      ) : (
        /* A sized Payload variant — the optimizer would only re-encode it. */
        <Image
          alt={item.visual.alt}
          className="h-full w-full object-cover"
          height={item.visual.height}
          src={item.visual.url}
          unoptimized
          width={item.visual.width}
        />
      )}
    </div>
    {/* The static caption is the readable fallback: the accessible text,
        the no-JS state, and what reduced-motion visitors see — Difference
        Text (ADR 0006), its contrast coming from the blend rather than a
        scrim. */}
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-start justify-end gap-2 mix-blend-difference p-6 md:flex-row md:items-center md:justify-between md:p-16">
      <h3
        className="text-3xl font-medium text-white md:text-5xl"
        data-static-caption
      >
        {item.title}
      </h3>
      {item.year !== null && (
        <p className="text-base text-white md:text-lg" data-static-caption>
          {item.year}
        </p>
      )}
    </div>
  </Link>
);

export const SelectedWorksSection = ({
  heading,
  works,
}: {
  heading: string;
  works: readonly (number | Work)[] | null | undefined;
}) => {
  const scopeRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const items = (works ?? []).flatMap((work) => {
    const item = toSelectedWorkItem(work);
    return item ? [item] : [];
  });

  // useGSAP runs before paint, so the overlay never flashes unclipped and
  // never doubles up with the static captions. The raw works prop is the
  // dep — stable identity across re-renders — and revertOnUpdate rebuilds
  // when Live Preview edits swap the Works out.
  useGSAP(
    () => {
      const scope = scopeRef.current;
      const list = listRef.current;
      const layer = scope?.querySelector<HTMLElement>("[data-pinned-layer]");
      if (!scope || !list || !layer || items.length === 0) return;

      const cards = gsap.utils.toArray<HTMLElement>("[data-work-card]", list);
      const cardRects = () =>
        cards.map((card) => toRect(card.getBoundingClientRect()));
      const staticCaptions = gsap.utils.toArray<HTMLElement>(
        "[data-static-caption]",
        scope,
      );
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      // ---- Works Rail ------------------------------------------------------
      // Runs before the reduced-motion gate below: the white↔dimmed mark
      // is information, not motion — only the arrow's slide is gated. CSS
      // sticky owns the rail's visibility (in with the first card, out with
      // the last); this block only tracks which Work holds the mark.
      const rail = scope.querySelector<HTMLElement>("[data-works-rail]");
      if (rail) {
        const entries = gsap.utils.toArray<HTMLElement>(
          "[data-rail-entry]",
          rail,
        );
        const arrow = rail.querySelector<HTMLElement>("[data-rail-arrow]");
        let current = 0;

        // The mark follows the rail itself: a hairline probe at the rail's
        // vertical middle, wherever sticky currently holds it — riding the
        // first Work's center on the way in, the viewport's middle while
        // stuck, the last Work's center on the way out. The Work covering
        // the probe is the marked one, flipping exactly as a seam crosses
        // the rail. The Pinned Caption keeps its own bottom-of-screen
        // rule, so the two can disagree for part of each handoff.
        const railProbe = (): Rect => {
          const box = rail.getBoundingClientRect();
          const middle = box.top + box.height / 2;
          return {
            top: middle - 0.5,
            right: innerWidth,
            bottom: middle + 0.5,
            left: 0,
          };
        };

        const mark = (index: number, instant = false) => {
          // Difference Text is white-only (ADR 0006), so the active mark is
          // full-opacity white against dimmed entries — not a color swap.
          entries.forEach((entry, i) => {
            entry.classList.toggle("opacity-40", i !== index);
          });
          const target = entries[index];
          if (!arrow || !target) return;
          arrow.classList.remove("invisible");
          const y = railArrowOffsetY(
            target.offsetTop,
            target.offsetHeight,
            arrow.offsetHeight,
          );
          if (instant || reduced) gsap.set(arrow, { y });
          else gsap.to(arrow, { y, duration: 0.35, ease: "power2.out" });
        };

        // The sticky rail is laid out from the start, so the first mark
        // lands pre-paint — and is what shows the arrow at all.
        mark(0, true);
        const applyRail = () => {
          const next = railActiveIndex(railProbe(), cardRects());
          // Nothing under the rail (the seam gap, or past the section's
          // ends) keeps the last mark.
          if (next === null || next === current) return;
          current = next;
          mark(next);
        };
        ScrollTrigger.create({
          trigger: list,
          start: "top bottom",
          end: "bottom top",
          onUpdate: applyRail,
          onRefresh: applyRail,
        });
      }

      // Reduced motion — and, by never running this, no-JS — keeps the
      // static in-card captions: the readable end state.
      if (reduced) {
        return;
      }

      const captions = gsap.utils.toArray<HTMLElement>(
        "[data-pinned-caption]",
        layer,
      );

      gsap.set(captions, { clipPath: "inset(0 0 100% 0)" });
      gsap.set(staticCaptions, { opacity: 0 });
      layer.classList.remove("hidden");

      // The drift: each media travels from bottom-flush to top-flush of its
      // card while the card crosses the viewport, lagging behind the scroll.
      // The card clips it, so the taller media only ever reads as motion.
      const travel = driftTravelPercent(MEDIA_OVERSHOOT);
      cards.forEach((card) => {
        const media = card.querySelector<HTMLElement>("[data-work-media]");
        if (!media) return;
        gsap.fromTo(
          media,
          { yPercent: -travel },
          {
            yPercent: 0,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });

      // Pure geometry: each caption shows exactly where its Work overlaps
      // the fixed caption zone, so the seam between two Works sweeps
      // through the caption and the content hands off mid-letter.
      const applyClips = () => {
        const zone = toRect(layer.getBoundingClientRect());
        cardRects().forEach((card, index) => {
          const caption = captions[index];
          if (!caption) return;
          caption.style.clipPath = formatClipPath(clipInsetsFor(zone, card));
        });
      };
      applyClips();

      ScrollTrigger.create({
        trigger: list,
        start: "top bottom",
        end: "bottom top",
        onUpdate: applyClips,
        onRefresh: applyClips,
      });
    },
    {
      scope: scopeRef,
      dependencies: [works],
      revertOnUpdate: true,
    },
  );

  if (items.length === 0) return null;

  return (
    <section aria-label={heading} className="pt-16" ref={scopeRef}>
      {/* The shared sticky-chip heading — the Client Marquee's heading
          renders through the same component. Sticks below the Navbar for the
          whole section; z-20 keeps it above the cards but below the Pinned
          Caption layer (z-30) should a very short viewport ever make the two
          meet. */}
      <SectionHeading>{heading}</SectionHeading>
      <div className="relative flex flex-col" ref={listRef}>
        {items.map((item) => (
          <SelectedWorkCard item={item} key={item.id} />
        ))}

        {/* The Works Rail: the section's Work titles down the right edge,
            the arrow marking the Work the rail itself sits on — an
            indicator only, so pointer-events-none never blocks the card
            Links and aria-hidden defers to the static captions as the
            accessible text. The wrapper spans the first card's middle to
            the last card's middle (h-svh cards make that exactly half a
            viewport in from each end of the list), so the rail rides in
            at the first Work's center, holds the viewport's middle, and
            departs at the last Work's center. The arrow ships invisible:
            only JS positions it, so no-JS gets the bare titles. The md:
            gate keeps it off small viewports; z-20 sits it above the
            cards but below the Pinned Caption layer should a short
            viewport ever overlap the two. The wrapper carries the
            difference blend — the sticky inner's parent stacking context
            is empty, so blending the inner would have no backdrop. */}
        <div className="pointer-events-none absolute bottom-[50svh] right-0 top-[50svh] z-20 mix-blend-difference">
          <div
            aria-hidden="true"
            className="sticky top-[50svh] -translate-y-1/2 hidden flex-col items-start gap-3 pr-24 md:flex"
            data-works-rail
          >
            <span
              className="invisible absolute left-0 top-0 text-white"
              data-rail-arrow
            >
              <ArrowRight />
            </span>
            {items.map((item) => (
              <span
                className="pl-6 text-3xl text-white"
                data-rail-entry
                key={item.id}
              >
                {item.title}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* The Pinned Caption layer: one caption per Work at the same fixed
          spot, each clipped to its Work's bounds. It ships display:none so
          no-JS never sees it (the grid lives on a child, so unhiding never
          fights the hidden utility); aria-hidden because the static
          captions remain the accessible text. The layer itself carries the
          difference blend — its fixed z-index stacking context would
          isolate blending applied to the captions inside it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 hidden mix-blend-difference"
        data-pinned-layer
      >
        <div className="grid">
          {items.map((item) => (
            <div
              className="col-start-1 row-start-1 flex flex-col items-start justify-end gap-2 p-6 md:flex-row md:items-center md:justify-between md:p-24"
              data-pinned-caption
              key={item.id}
            >
              <h3 className="text-3xl font-medium text-white md:text-7xl">
                {item.title}
              </h3>
              {item.year !== null && (
                <p className="text-base text-white md:text-2xl">{item.year}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
