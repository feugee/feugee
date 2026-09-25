"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { ArrowRight } from "@/components/ArrowRight";
import { AutoVideo } from "@/components/AutoVideo";
import { navigateWithBlackout } from "@/components/page-transition/navigateWithBlackout";
import { ScrollProgress } from "@/components/ScrollProgress";
import type { CardWork } from "@/components/work";

gsap.registerPlugin(useGSAP, CustomEase);

// The site's swipe curve (globals.css --ease-swipe) as a GSAP ease, so the
// reorder rides the same 400ms as every Swipe Text exchange and the Cursor's
// morph. cubic-bezier(0.65, 0, 0.35, 1), stated in CustomEase's native path
// form.
CustomEase.create("swipe", "M0,0 C0.65,0 0.35,1 1,1");

export interface WorksListItem extends CardWork {
  firstExpertise: string | null;
  sectorSlug: string | null;
}

export interface SectorOption {
  name: string;
  slug: string;
}

/** A card's committed place: grid-space coordinates plus everything a ghost
 * needs to re-render the card after React unmounts it. */
interface CardSpot {
  item: WorksListItem;
  left: number;
  top: number;
  width: number;
}

/** A departing card — its last CardSpot, held just long enough to recede. */
type GhostCard = CardSpot & { id: number };

const desktopQuery = "(min-width: 1024px)";
const hoverQuery = "(hover: hover)";

const subscribeMediaQuery =
  (query: string) =>
  (onChange: () => void): (() => void) => {
    const mediaQuery = window.matchMedia(query);
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  };

const subscribeDesktop = subscribeMediaQuery(desktopQuery);
const getDesktopSnapshot = () => window.matchMedia(desktopQuery).matches;

const subscribeHover = subscribeMediaQuery(hoverQuery);
const getHoverSnapshot = () => window.matchMedia(hoverQuery).matches;

const getServerSnapshot = () => false;

/**
 * Row-major-ish masonry: each item joins the currently shorter column, so the
 * curated order still reads left-to-right while the columns stay balanced.
 * Column heights are compared as sums of aspect ratios (height / width), which
 * is exact for equal-width columns and needs no image-load wait.
 */
const balanceColumns = (items: WorksListItem[]): WorksListItem[][] => {
  const columns: { items: WorksListItem[]; height: number }[] = [
    { items: [], height: 0 },
    { items: [], height: 0 },
  ];

  for (const item of items) {
    const shortest =
      columns[0].height <= columns[1].height ? columns[0] : columns[1];
    shortest.items.push(item);
    shortest.height +=
      item.visual.width > 0 ? item.visual.height / item.visual.width : 1;
  }

  return columns.map((column) => column.items);
};

const WorkVisual = ({ item }: { item: WorksListItem }) =>
  item.visual.kind === "video" ? (
    // Video thumbnails autoplay muted while on screen; the poster-derived
    // width/height keep the card's slot identical to an image card's.
    <AutoVideo
      alt={item.visual.alt}
      className="h-auto w-full object-cover"
      height={item.visual.height}
      poster={item.visual.posterUrl}
      src={item.visual.url}
      width={item.visual.width}
    />
  ) : (
    /* A sized Payload variant — the optimizer would only re-encode it. */
    <Image
      alt={item.visual.alt}
      className="h-auto w-full object-cover"
      height={item.visual.height}
      src={item.visual.url}
      unoptimized
      width={item.visual.width}
    />
  );

// A departing card's last frame: pinned exactly where the card was, deaf to
// pointers and screen readers — purely a surface for the exit recede to
// play on while the survivors slide through the space it vacates.
const WorkGhost = ({ ghost }: { ghost: GhostCard }) => (
  <div
    aria-hidden="true"
    className="absolute"
    data-work-ghost
    style={{ left: ghost.left, top: ghost.top, width: ghost.width }}
  >
    <WorkVisual item={ghost.item} />
  </div>
);

const WorkCard = ({
  item,
  dimmed,
  canHover,
  onHoverStart,
  onHoverEnd,
}: {
  item: WorksListItem;
  dimmed: boolean;
  canHover: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}) => (
  <Link
    className="group/card relative block"
    data-work-card
    data-work-card-id={item.id}
    href={`/works/${item.slug}`}
    onNavigate={(event) => navigateWithBlackout(event, `/works/${item.slug}`)}
    onMouseEnter={canHover ? onHoverStart : undefined}
    onMouseLeave={canHover ? onHoverEnd : undefined}
  >
    <div
      className={`transition-[filter] duration-300 ${dimmed ? "grayscale" : ""}`}
    >
      <WorkVisual item={item} />
    </div>
    {/* Hover reveals the caption on hover-capable pointers (Tailwind's
        hover: variant is (hover: hover)-guarded); below lg it is the default
        instead, since mobile and tablet have no hover to reveal it. The
        underlay is a blur gradient — the Thumbnail's own pixels, blurred by
        backdrop-filter and faded out by a mask, no dark scrim; blur(0px)
        rather than none keeps the hover transition interpolable. The text is
        Difference Text (ADR 0006) and a sibling of the underlay, not its
        child: a parent carrying backdrop-filter or a fading opacity isolates
        its children, and the blend would never reach the media. The text
        keeps its own opacity fade because blend and opacity compose on the
        same element. */}
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-1/2 items-end">
      <div className="absolute inset-0 opacity-0 backdrop-blur-[0px] mask-[linear-gradient(to_top,black_30%,transparent)] transition-[opacity,backdrop-filter] duration-300 max-lg:opacity-100 max-lg:backdrop-blur-md group-hover/card:backdrop-blur-md group-hover/card:opacity-100" />
      <div className="relative flex w-full items-baseline justify-between gap-4 p-4 opacity-0 transition-opacity duration-300 mix-blend-difference max-lg:opacity-100 group-hover/card:opacity-100">
        <h2 className="text-3xl text-white font-bold">{item.title}</h2>
        {item.firstExpertise && (
          <span className="text-xl text-white">{item.firstExpertise}</span>
        )}
      </div>
    </div>
  </Link>
);

export const WorksListing = ({
  items,
  sectorOptions,
  showFilter,
}: {
  items: WorksListItem[];
  sectorOptions: SectorOption[];
  showFilter: boolean;
}) => {
  const filterable = showFilter && sectorOptions.length > 0;

  const [activeSector, setActiveSector] = useState<string | null>(null);

  const selectSector = (slug: string | null) => {
    if (slug === activeSector) return;
    setActiveSector(slug);
    // pushState makes each selection a history entry (Back walks the filter
    // choices) without an RSC round-trip that would refetch the
    // already-client-filtered list.
    const url = slug ? `/works?sector=${encodeURIComponent(slug)}` : "/works";
    window.history.pushState(window.history.state, "", url);
  };

  // The page renders statically, so the deep-link filter (?sector=…) is read
  // on the client after mount; popstate re-syncs history traversal over the
  // pushed filter entries. Anything unknown falls back to "All".
  useEffect(() => {
    const syncFromLocation = () => {
      const slug = new URLSearchParams(window.location.search).get("sector");
      setActiveSector(
        slug !== null && sectorOptions.some((sector) => sector.slug === slug)
          ? slug
          : null,
      );
    };

    syncFromLocation();
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, [sectorOptions]);

  const filteredItems = useMemo(
    () =>
      activeSector === null
        ? items
        : items.filter((item) => item.sectorSlug === activeSector),
    [items, activeSector],
  );

  // Two balanced columns on desktop (lg+); tablet shares mobile's single
  // column with the sidebar above it. The server renders that layout so the
  // curated order is correct in the initial HTML.
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    getServerSnapshot,
  );
  const columns = useMemo(
    () => (isDesktop ? balanceColumns(filteredItems) : [filteredItems]),
    [filteredItems, isDesktop],
  );

  // Hover dimming: the hovered card keeps its color, every other card
  // desaturates. Mouse events emulate on tap, so gate on hover capability.
  const canHover = useSyncExternalStore(
    subscribeHover,
    getHoverSnapshot,
    getServerSnapshot,
  );
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // The reorder: when the filter (or column count) changes, everything moves
  // on the same frame — survivors FLIP from their previous spot to the new
  // one, entering cards rise in at theirs (first paint included), and
  // departing cards linger as ghosts that recede while the survivors slide
  // through the space they vacate. Spots are offsetLeft/offsetTop keyed by
  // card id, not DOM nodes: the masonry can remount a card into the other
  // column on desktop, and offset coordinates are both scroll-proof (layout
  // space, not viewport, so scrolling between filters can't skew the deltas)
  // and transform-proof (an interrupted FLIP mid-flight can't pollute the
  // next measurement). The relative list wrapper is the cards' offsetParent,
  // so those coordinates are also exactly where a ghost pins itself.
  const gridRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const cardSpotsRef = useRef(new Map<number, CardSpot>());

  const [ghosts, setGhosts] = useState<GhostCard[]>([]);
  const [prevFiltered, setPrevFiltered] = useState(filteredItems);

  // Ghosts are derived during render — React's adjust-state-when-data-changes
  // pattern — so a departing card overlaps its own ghost with no unmounted
  // flash. cardSpotsRef still holds the cards the last commit actually
  // rendered, so the leavers are exactly its entries that the new filter
  // drops. A leaver that re-enters (a quick toggle back) cancels its ghost
  // on the same render, or the real card and its ghost would double up.
  if (prevFiltered !== filteredItems) {
    setPrevFiltered(filteredItems);
    const liveIds = new Set(filteredItems.map((item) => item.id));
    setGhosts((prev) => {
      const kept = prev.filter((ghost) => !liveIds.has(ghost.id));
      const added = [...cardSpotsRef.current.entries()]
        .filter(([id]) => !liveIds.has(id))
        .map(([id, spot]) => ({ id, ...spot }));
      const next = [...kept, ...added];
      const unchanged =
        next.length === prev.length &&
        next.every((ghost, index) => ghost.id === prev[index]?.id);
      return unchanged ? prev : next;
    });
  }

  useGSAP(
    () => {
      const list = listRef.current;
      if (!list) return;
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      // The exit: ghosts step back from the page while letting go — a touch
      // quicker than the survivors' slide, so the stage clears first.
      const ghostEls = Array.from(
        list.querySelectorAll<HTMLElement>("[data-work-ghost]"),
      );
      if (ghostEls.length > 0) {
        if (reduced) setGhosts([]);
        else
          gsap.fromTo(
            ghostEls,
            { opacity: 1, scale: 1 },
            {
              opacity: 0,
              scale: 0.97,
              duration: 0.3,
              ease: "power2.out",
              onComplete: () => setGhosts([]),
            },
          );
      }

      const grid = gridRef.current;
      if (!grid) {
        // The "coming soon" empty state replaced the grid; start over.
        cardSpotsRef.current = new Map();
        return;
      }

      const previousSpots = cardSpotsRef.current;
      const spots = new Map<number, CardSpot>();
      const movers: { card: HTMLElement; dx: number; dy: number }[] = [];
      const enterers: HTMLElement[] = [];
      const itemById = new Map(filteredItems.map((item) => [item.id, item]));

      for (const card of grid.querySelectorAll<HTMLElement>(
        "[data-work-card-id]",
      )) {
        const id = Number(card.dataset.workCardId);
        const item = itemById.get(id);
        if (!item) continue;
        const spot: CardSpot = {
          item,
          left: card.offsetLeft,
          top: card.offsetTop,
          width: card.offsetWidth,
        };
        spots.set(id, spot);
        const before = previousSpots.get(id);
        if (!before) {
          enterers.push(card);
        } else {
          const dx = before.left - spot.left;
          const dy = before.top - spot.top;
          if (dx !== 0 || dy !== 0) movers.push({ card, dx, dy });
        }
      }
      cardSpotsRef.current = spots;

      if (reduced) return;

      // Everyone travels at once — exits, slides, and entries start on the
      // same frame; only the enterers' stagger varies, since a movement
      // stagger reads as lag, not craft.
      for (const { card, dx, dy } of movers) {
        gsap.fromTo(
          card,
          { x: dx, y: dy },
          { x: 0, y: 0, duration: 0.4, ease: "swipe", overwrite: "auto" },
        );
      }
      if (enterers.length > 0) {
        gsap.fromTo(
          enterers,
          { opacity: 0, y: 16 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: "swipe",
            stagger: 0.03,
            overwrite: "auto",
          },
        );
      }
    },
    { dependencies: [activeSector, isDesktop], revertOnUpdate: true },
  );

  const mainRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mx-auto min-h-screen grid w-full lg:grid-cols-[360px_1fr]">
      <ScrollProgress scope={mainRef} />
      {/* The lg+ sticky top already seats the aside clear of the overlaid
          navbar (sticky pushes down to its offset); below lg it is static
          above the single column, so the padding supplies that clearance
          there instead. */}
      <aside className="self-start lg:pb-6 px-6 max-lg:pt-[calc(var(--navbar-height)+2.5rem)] lg:sticky lg:top-[calc(var(--navbar-height)+2.5rem)]">
        {/* A div, not a nav: the filter buttons are controls, not links. */}
        <div className="lg:space-y-12">
          <div className="w-full space-y-6 border-b border-neutral-900 pb-12">
            <h1 className="block text-4xl font-bold text-neutral-50">
              Our Works
            </h1>
            <p className="block text-lg text-neutral-500">
              Ambitious ideas for ambitious business
            </p>
          </div>
          {filterable && (
            <ul className="max-lg:hidden space-y-2">
              {[null, ...sectorOptions].map((sector) => {
                const active = activeSector === (sector?.slug ?? null);
                return (
                  <li key={sector?.slug ?? "all"}>
                    <button
                      aria-pressed={active}
                      className={`flex w-full items-center gap-2 text-left text-xl transition-colors ${
                        active ? "text-primary-500" : "text-neutral-800"
                      }`}
                      onClick={() => selectSector(sector?.slug ?? null)}
                      type="button"
                    >
                      {/* Reserved slot keeps labels steady as the arrow toggles. */}
                      <span className="inline-flex w-5 shrink-0 justify-center">
                        {active ? <ArrowRight /> : null}
                      </span>
                      {sector?.name ?? "All"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <div className="w-full" ref={mainRef}>
        {/* The below-lg filter is a sticky pill tab bar. It lives here, not in
            the aside, because a sticky element only sticks within its
            containing block: on mobile the aside is a short grid row that
            scrolls away with the intro, while this column spans the whole
            listing. It parks directly under the navbar (sticky pushes down to
            its offset) and z-30 seats it below the navbar's z-40. The bar
            wears the Selected Works sticky heading's chip — dark,
            translucent, blurred — so cards slide under it softened rather
            than being masked by an opaque bar. The chip hugs its tabs and
            centers; once they overflow, w-fit fills the row and the ul
            scrolls from the left — a centered scroll row can't reach its
            own start. */}
        {filterable && (
          <div className="flex justify-center px-6 py-3 sticky top-(--navbar-height) z-30 lg:hidden">
            <ul className="flex w-fit gap-2 overflow-x-auto rounded border border-neutral-700 bg-neutral-950/70 p-2 backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[null, ...sectorOptions].map((sector) => {
                const active = activeSector === (sector?.slug ?? null);
                return (
                  <li className="shrink-0" key={sector?.slug ?? "all"}>
                    <button
                      aria-pressed={active}
                      className={`rounded-md px-4 py-2 text-base whitespace-nowrap transition-colors ${
                        active
                          ? "bg-primary-500 text-white"
                          : "text-neutral-400"
                      }`}
                      onClick={() => selectSector(sector?.slug ?? null)}
                      type="button"
                    >
                      {sector?.name ?? "All"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {/* The list wrapper is relative for one reason: it is the cards'
            offsetParent, making their spot coordinates and the ghost layer's
            absolute positioning one shared coordinate space. The ghost layer
            sits at negative z so survivors — transformed mid-FLIP or not —
            always paint over the copies receding beneath them. */}
        <div className="relative" ref={listRef}>
          {ghosts.length > 0 && (
            <div
              aria-hidden="true"
              className="-z-10 pointer-events-none absolute inset-0"
            >
              {ghosts.map((ghost) => (
                <WorkGhost ghost={ghost} key={ghost.id} />
              ))}
            </div>
          )}
          {filteredItems.length === 0 ? (
            <p className="p-8 text-xl text-neutral-600">Works coming soon</p>
          ) : (
            <div className="flex w-full flex-col gap-1 lg:flex-row" ref={gridRef}>
              {columns.map((column, columnIndex) => (
                <div
                  className="flex w-full flex-1 flex-col gap-1"
                  key={columnIndex}
                >
                  {column.map((item) => (
                    <WorkCard
                      canHover={canHover}
                      dimmed={
                        canHover && hoveredId !== null && hoveredId !== item.id
                      }
                      item={item}
                      key={item.id}
                      onHoverEnd={() => setHoveredId(null)}
                      onHoverStart={() => setHoveredId(item.id)}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
