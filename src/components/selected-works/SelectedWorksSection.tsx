"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import type { Work } from "@/payload-types";

import { AmbientYouTube } from "@/components/AmbientYouTube";
import { AutoVideo } from "@/components/AutoVideo";
import { navigateWithBlackout } from "@/components/page-transition/navigateWithBlackout";
import { SectionHeading } from "@/components/SectionHeading";

import { clipInsetsFor, formatClipPath, type Rect } from "./captionClip";
import { MEDIA_OVERSHOOT, driftTravelPercent } from "./mediaDrift";
import {
  RAIL_LINE_MAX_PX,
  RAIL_LINE_REST_PX,
  RAIL_TITLE_REVEAL_RADIUS_PX,
  railLineWidth,
  type RailAnchor,
} from "./railProximity";
import { toSelectedWorkItem, type SelectedWorkItem } from "./selectedWorkItem";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const toRect = (rect: DOMRect): Rect => ({
  top: rect.top,
  right: rect.right,
  bottom: rect.bottom,
  left: rect.left,
});

const SelectedWorkCard = ({ item }: { item: SelectedWorkItem }) => (
  // The id is the Works Rail's anchor target: a rail row scrolls this
  // card to the viewport's top — Lenis's anchor handling, a native jump
  // without it.
  <Link
    className="relative block h-svh overflow-hidden"
    data-cursor="see-more"
    data-work-card
    href={`/works/${item.slug}`}
    id={item.slug}
    onNavigate={(event) => navigateWithBlackout(event, `/works/${item.slug}`)}
  >
    {/* The drift track: taller than the card so it can travel while the
        card clips it. No-JS leaves it top-flush — a static, fully covered
        frame. */}
    <div data-work-media style={{ height: `${MEDIA_OVERSHOOT * 100}%` }}>
      {item.visual.kind === "video" ? (
        item.visual.source.type === "youtube" ? (
          <AmbientYouTube
            alt={item.visual.alt}
            frameClassName="h-full w-full"
            height={item.visual.height}
            poster={item.visual.posterUrl}
            videoId={item.visual.source.videoId}
            width={item.visual.width}
          />
        ) : (
          <AutoVideo
            alt={item.visual.alt}
            className="h-full w-full object-cover"
            height={item.visual.height}
            poster={item.visual.posterUrl}
            src={item.visual.source.url}
            width={item.visual.width}
          />
        )
      ) : (
        /* A sized Payload variant — the optimizer would only re-encode it. */
        <Image
          alt={item.visual.alt}
          className="h-full w-full object-cover"
          height={item.visual.height}
          src={item.visual.url}
          width={item.visual.width}
        />
      )}
    </div>
    {/* The static caption is the readable fallback: the accessible text and
        the no-JS state, hidden once the Pinned Caption takes over —
        Difference Text (ADR 0006), its contrast coming from the blend rather
        than a scrim. */}
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

      // The rail's hooks are no-ops until the block below wires them;
      // applyClips and the shared ScrollTrigger call them unconditionally.
      let measureRail: () => void = () => {};
      let applyRailClip: () => void = () => {};
      let teardownRail: () => void = () => {};

      // ---- Works Rail ------------------------------------------------------
      // A fixed layer like the Pinned Caption, not a sticky traveler: held
      // at the viewport's middle, visible only while the works list passes
      // beneath it — the same clip-path geometry as the captions, with the
      // list itself as the covering Work. The reveal edge is the list's own
      // top and bottom edge, so the rail wipes in as the first card crosses
      // it and drains away as the last one leaves.
      const rail = scope.querySelector<HTMLElement>("[data-works-rail]");
      const railLayer = rail?.querySelector<HTMLElement>("[data-rail-layer]");

      if (rail && railLayer) {
        const rows = gsap.utils.toArray<HTMLElement>(
          "[data-rail-row]",
          railLayer,
        );
        const lines = gsap.utils.toArray<HTMLElement>(
          "[data-rail-line]",
          railLayer,
        );
        const titles = gsap.utils.toArray<HTMLElement>(
          "[data-rail-title]",
          railLayer,
        );
        // quickTo retargets one persistent tween per line, so a mousemove
        // storm never piles up tweens.
        const widthTos = lines.map((line) =>
          gsap.quickTo(line, "width", { duration: 0.4, ease: "power3.out" }),
        );
        const titleTos = titles.map((title) =>
          gsap.quickTo(title, "opacity", {
            duration: 0.25,
            ease: "power2.out",
          }),
        );

        let railRect: Rect | null = null;
        let anchors: RailAnchor[] = [];
        let revealed = -1;
        let railVisible = false;

        // The layer is fixed, so its lines never move with scroll — their
        // viewport positions are measured once and again on refresh
        // (resize), never per mousemove. Lines are right-flush, so a
        // swollen line grows leftward and its right end stays the anchor.
        measureRail = () => {
          railRect = toRect(railLayer.getBoundingClientRect());
          anchors = lines.map((line) => {
            const rect = line.getBoundingClientRect();
            return { x: rect.right, y: rect.top + rect.height / 2 };
          });
        };

        const resetRail = () => {
          widthTos.forEach((to) => to(RAIL_LINE_REST_PX));
          if (revealed >= 0) {
            titleTos[revealed](0);
            revealed = -1;
          }
        };

        // The proximity: every line swells by its distance to the pointer;
        // the nearest Work's title rides beside its line while the pointer
        // stays within the reveal radius, one title at a time.
        const applyProximity = (event: MouseEvent) => {
          if (!railVisible || anchors.length === 0) return;
          let nearest = -1;
          let nearestDistance = Infinity;
          anchors.forEach((anchor, i) => {
            const distance = Math.hypot(
              event.clientX - anchor.x,
              event.clientY - anchor.y,
            );
            widthTos[i](railLineWidth(distance));
            if (distance < nearestDistance) {
              nearestDistance = distance;
              nearest = i;
            }
          });
          const next =
            nearestDistance <= RAIL_TITLE_REVEAL_RADIUS_PX ? nearest : -1;
          if (next !== revealed) {
            if (revealed >= 0) titleTos[revealed](0);
            if (next >= 0) titleTos[next](1);
            revealed = next;
          }
        };

        // Visible exactly where the list covers the layer. Clipped-away
        // regions never hit-test, so a half-wiped row can't be clicked.
        applyRailClip = () => {
          if (!railRect) return;
          const listRect = toRect(list.getBoundingClientRect());
          railLayer.style.clipPath = formatClipPath(
            clipInsetsFor(railRect, listRect),
          );
          const visible =
            listRect.top < railRect.bottom && listRect.bottom > railRect.top;
          if (!visible && railVisible) resetRail();
          railVisible = visible;
        };

        // Keyboard parity for the pointer's proximity: focusing a row
        // swells its line and reveals its title.
        const onFocused = (index: number) => {
          widthTos[index](RAIL_LINE_MAX_PX);
          if (revealed >= 0 && revealed !== index) titleTos[revealed](0);
          titleTos[index](1);
          revealed = index;
        };
        const onFocusIn = (event: FocusEvent) => {
          if (!(event.target instanceof Element)) return;
          const row = event.target.closest<HTMLElement>("[data-rail-row]");
          if (!row) return;
          const index = rows.indexOf(row);
          if (index >= 0) onFocused(index);
        };
        const onFocusOut = (event: FocusEvent) => {
          if (!railLayer.contains(event.relatedTarget as Node | null)) {
            resetRail();
          }
        };

        // Fine pointers only — the proximity is a pointer instrument, and
        // the unhide doubles as the gate: no-JS and touch viewports never
        // see the rail at all. Checked once at mount; the inner md:block
        // keeps phone and tablet bare on top of this.
        if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
          rail.classList.remove("hidden");
          measureRail();
          window.addEventListener("mousemove", applyProximity);
          document.documentElement.addEventListener("mouseleave", resetRail);
          railLayer.addEventListener("focusin", onFocusIn);
          railLayer.addEventListener("focusout", onFocusOut);
          teardownRail = () => {
            window.removeEventListener("mousemove", applyProximity);
            document.documentElement.removeEventListener(
              "mouseleave",
              resetRail,
            );
            railLayer.removeEventListener("focusin", onFocusIn);
            railLayer.removeEventListener("focusout", onFocusOut);
          };
        }
      }

      // No-JS never runs this and keeps the static in-card captions: the
      // readable end state.
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
      // through the caption and the content hands off mid-letter. The rail
      // clips against the list as a whole, so one trigger drives both
      // fixed layers.
      const applyClips = () => {
        const zone = toRect(layer.getBoundingClientRect());
        cardRects().forEach((card, index) => {
          const caption = captions[index];
          if (!caption) return;
          caption.style.clipPath = formatClipPath(clipInsetsFor(zone, card));
        });
        applyRailClip();
      };
      applyClips();

      ScrollTrigger.create({
        trigger: list,
        start: "top bottom",
        end: "bottom top",
        onUpdate: applyClips,
        onRefresh: () => {
          measureRail();
          applyClips();
        },
      });

      return () => {
        teardownRail();
      };
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
      </div>

      {/* The Works Rail: one line per Work down the right edge, held at the
          viewport's middle — a fixed layer like the Pinned Caption, not the
          sticky traveler it replaced, visible only while the works list
          passes beneath it (the JS clips it with the same geometry as the
          captions, the list itself as the covering Work). At rest the lines
          are equal; the pointer swells them by proximity and reveals the
          nearest Work's title beside its line, anchored to the line's left
          end via the shrink-wrap span so the title rides the line's growth —
          and pointer-events-none, so the invisible title never widens the
          row's hit area over the card. Each row is a real link to its
          card's id: Lenis's anchor handling scrolls the Work to the
          viewport's top, a native jump without it — which is why the rows
          carry pointer events while the layer stays pointer-events-none,
          leaving the cards and the Cursor everything but the rows. The
          outer div ships hidden and is unhidden by JS on fine-pointer
          devices only: no-JS never sees a rail floating over the whole
          page, and the inner md:block keeps phone and tablet bare. The
          layer carries the difference blend — blending inside its fixed
          stacking context would have no backdrop (see the Pinned Caption).
          z-30 matches the Pinned Caption layer; the two never overlap, and
          a very short viewport would hand the seam to whichever renders
          later. */}
      <div className="hidden" data-works-rail>
        {/* The layer spans the whole viewport, not just the rail: the
            clip-path clips to the element's own box, and the revealed
            titles overhang the lines' left ends — a rail-sized box would
            shave them mid-letter. */}
        <div
          className="pointer-events-none fixed inset-0 z-30 hidden mix-blend-difference md:block"
          data-rail-layer
        >
          <ul className="absolute right-0 top-1/2 flex -translate-y-1/2 flex-col items-end gap-y-0 gap-x-4 pr-16">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  className="pointer-events-auto flex h-8 w-28 items-center justify-end"
                  data-rail-row
                  href={`#${item.slug}`}
                >
                  <span className="relative flex items-center">
                    <span
                      className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap text-lg text-white opacity-0"
                      data-rail-title
                    >
                      {item.title}
                    </span>
                    <span className="block h-0.5 w-6 bg-white" data-rail-line />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
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
              className="col-start-1 row-start-1 flex flex-col items-center justify-end gap-2 p-6 md:flex-row md:items-end md:justify-between lg:p-16"
              data-pinned-caption
              key={item.id}
            >
              <h3 className="text-3xl text-center lg:text-start font-medium text-white lg:text-4xl xl:text-5xl 2xl:text-7xl lg:max-w-[60%] ">
                {item.title}
              </h3>
              {item.year !== null && (
                <p className="text-base text-white md:text-2xl lg:text-2xl xl:text-4xl 2xl:text-5xl">
                  {item.year}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
