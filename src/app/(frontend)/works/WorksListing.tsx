"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { ArrowPush } from "@/components/ArrowPush";
import { AutoVideo } from "@/components/AutoVideo";
import { AmbientYouTube } from "@/components/AmbientYouTube";
import { navigateWithBlackout } from "@/components/page-transition/navigateWithBlackout";
import { ScrollProgress } from "@/components/ScrollProgress";
import type { CardBadge, CardWork } from "@/components/work";

import { reduceFilterSwap } from "./filterSwap";
import { SectorFilter } from "./SectorFilter";

gsap.registerPlugin(useGSAP, CustomEase);

// The site's swipe curve (globals.css --ease-swipe) as a GSAP ease, so the
// Filter Swap rides the same curve as every Swipe Text exchange and the
// Cursor's morph. cubic-bezier(0.65, 0, 0.35, 1), stated in CustomEase's
// native path form.
CustomEase.create("swipe", "M0,0 C0.65,0 0.35,1 1,1");

export interface WorksListItem extends CardWork {
  firstExpertise: string | null;
  sectorSlug: string | null;
  badge: CardBadge | null;
}

export interface SectorOption {
  name: string;
  slug: string;
}

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
    item.visual.source.type === "youtube" ? (
      // Embedded thumbnails autoplay muted like uploaded ones; the ingested
      // poster-derived width/height keep the card's slot identical.
      <AmbientYouTube
        alt={item.visual.alt}
        frameClassName="w-full"
        height={item.visual.height}
        poster={item.visual.posterUrl}
        videoId={item.visual.source.videoId}
        width={item.visual.width}
      />
    ) : (
      // Video thumbnails autoplay muted while on screen; the poster-derived
      // width/height keep the card's slot identical to an image card's.
      <AutoVideo
        alt={item.visual.alt}
        className="h-auto w-full object-cover"
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
      className="h-auto w-full object-cover"
      height={item.visual.height}
      src={item.visual.url}
      width={item.visual.width}
    />
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
    className="group/card relative block lg:rounded-md overflow-hidden"
    data-work-card
    data-work-card-id={item.id}
    data-cursor-logo={item.clientLogo ?? undefined}
    href={`/works/${item.slug}`}
    onNavigate={(event) => navigateWithBlackout(event, `/works/${item.slug}`)}
    onMouseEnter={canHover ? onHoverStart : undefined}
    onMouseLeave={canHover ? onHoverEnd : undefined}
  >
    <div
      className={`transition-[filter] duration-[600ms] ease-swipe ${dimmed ? "grayscale" : ""}`}
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
        keeps its own fade-and-rise — opacity and translate as one
        transition, so the slide cannot drift out of step with the fade —
        because blend and opacity compose on the same element. Timings ride
        the site-wide swipe curve: the grayscale dimming at 600ms, the
        caption's arrival and mirrored exit at 400ms. */}
    <div className="pointer-events-none absolute inset-x-0 -bottom-px flex h-1/2 items-end lg:rounded-md overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-400 ease-swipe group-hover/card:opacity-100" />
      <div className="absolute inset-0 opacity-0 backdrop-blur-[0px] mask-[linear-gradient(to_top,black_30%,transparent)] transition-[opacity,backdrop-filter] duration-400 ease-swipe max-lg:opacity-100 max-lg:backdrop-blur-md group-hover/card:backdrop-blur-md group-hover/card:opacity-100" />
      <div className="relative flex w-full items-baseline justify-between gap-4 p-6 translate-y-3 opacity-0 transition-[opacity,translate] duration-400 ease-swipe max-lg:translate-y-0 max-lg:opacity-100 group-hover/card:translate-y-0 group-hover/card:opacity-100 lg:rounded-md overflow-hidden">
        <h2 className="text-2xl text-white font-medium">{item.title}</h2>
        {item.firstExpertise && (
          <span className="text-[18px] text-white">{item.firstExpertise}</span>
        )}
      </div>
    </div>
    {/* The Badge ribbon: always visible, above the grayscale dim — a Badge's
        job is to be seen without interaction. It hangs off the card's right
        edge with a swallowtail notch cut into its free end by a clip-path
        whose lone px vertex keeps the cut while the ribbon widens leftward
        to reveal the name behind the icon — the icon rides the free end
        with the notch. The wipe rides the caption's swipe timing on a
        0fr→1fr grid track rather than a max-width cap, which would finish
        early on short names and outpace the card's other hover motion; like
        the caption, the name is the resting state below lg where there is
        no hover. The name is aria-hidden because the icon's alt already
        carries it; the reveal replaced the old tooltip. The whole card
        stays the link, so the ribbon takes no pointer handling of its
        own. */}
    {item.badge && (
      <span
        className="absolute right-0 top-6 flex h-10 items-center pl-4 pr-3 text-base text-white [clip-path:polygon(0_0,100%_0,100%_100%,0_100%,12px_50%)]"
        style={{ backgroundColor: item.badge.color }}
      >
        {/* As uploaded — unoptimized like the Client Marquee's logos, since
            the optimizer refuses the SVGs badges are likely to be. */}
        <Image
          alt={item.badge.name}
          className="size-5 lg:size-6 object-contain"
          height={24}
          src={item.badge.iconUrl}
          unoptimized
          width={24}
        />
        <span
          aria-hidden="true"
          className="grid max-w-48 grid-cols-[minmax(0,0fr)] opacity-0 transition-[grid-template-columns,opacity] duration-400 ease-swipe group-hover/card:grid-cols-[minmax(0,1fr)] group-hover/card:opacity-100 max-lg:grid-cols-[minmax(0,1fr)] max-lg:opacity-100"
        >
          <span className="min-w-0 overflow-hidden pl-3 whitespace-nowrap text-xs lg:text-base">
            {item.badge.name}
          </span>
        </span>
      </span>
    )}
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
  // pushed filter entries. Anything unknown falls back to "All". A deep link
  // resolving from the mount sync arms `unseenStage`: the listing has not
  // shown a card yet, so the swap machine commits straight to it and the
  // load entrance plays on the deep-linked set instead of swapping onto it.
  const [unseenStage, setUnseenStage] = useState(false);
  useEffect(() => {
    const syncFromLocation = (fromMount: boolean) => {
      const slug = new URLSearchParams(window.location.search).get("sector");
      const next =
        slug !== null && sectorOptions.some((sector) => sector.slug === slug)
          ? slug
          : null;
      if (fromMount) setUnseenStage(next !== null);
      setActiveSector(next);
    };

    syncFromLocation(true);
    const syncFromHistory = () => syncFromLocation(false);
    window.addEventListener("popstate", syncFromHistory);
    return () => window.removeEventListener("popstate", syncFromHistory);
  }, [sectorOptions]);

  const filteredItems = useMemo(
    () =>
      activeSector === null
        ? items
        : items.filter((item) => item.sectorSlug === activeSector),
    [items, activeSector],
  );

  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    getServerSnapshot,
  );
  // The Filter Swap (CONTEXT.md): the listing exchanges as one clean stage —
  // no diff, no FLIP choreography. The machine (filterSwap.ts) owns the
  // two phases; this component only renders `shown` and animates whatever
  // phase is live: exit — everything on stage slides up and fades out
  // together — then, strictly after it clears, enter — the new set arrives
  // from 16px below with the shared 0.03s stagger. Because survivors exit
  // and re-enter with everything else, there is nothing to measure: no
  // spots, no FLIP, no ghosts — which also frees viewport resizes from the
  // animation entirely (a re-layout is not a swap, so isDesktop is
  // deliberately not a trigger here; cards just re-render in their new
  // columns). A crossing that lands mid-phase degrades gracefully: cards
  // remounting between columns skip their tween and sit at rest until the
  // phase's commit re-renders the stage.
  const [swap, dispatchSwap] = useReducer(reduceFilterSwap, {
    shown: filteredItems,
    exiting: false,
  });

  // Two balanced columns on desktop (lg+); tablet shares mobile's single
  // column with the sidebar above it. The server renders that layout so the
  // curated order is correct in the initial HTML. Derived from `shown`, not
  // `filteredItems`: during an exit the columns belong to the departing
  // stage, which the grid must keep rendering.
  const columns = useMemo(
    () => (isDesktop ? balanceColumns(swap.shown) : [swap.shown]),
    [swap.shown, isDesktop],
  );

  // Hover dimming: the hovered card keeps its color, every other card
  // desaturates. Mouse events emulate on tap, so gate on hover capability.
  const canHover = useSyncExternalStore(
    subscribeHover,
    getHoverSnapshot,
    getServerSnapshot,
  );
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // A Sector Filter change — sidebar button, Bottom Sheet, or history
  // traversal — arrives mid-render, its highlight and URL already moved.
  // The listing hands the change to the machine: cards on stage pin as
  // `shown` and the exit plays; an empty stage commits straight to the new
  // set. Hover dimming goes with the departing stage.
  const [prevSector, setPrevSector] = useState(activeSector);
  if (prevSector !== activeSector) {
    setPrevSector(activeSector);
    setHoveredId(null);
    dispatchSwap({
      type: "sectorChanged",
      filtered: filteredItems,
      unseenStage,
    });
    setUnseenStage(false);
  }

  // The exit's completion lands as a flag, not a callback payload: the
  // commit must name the set the NEWEST selection filtered to, and a render
  // is the only place that is fresh. Same adjust pattern — dispatched in
  // the order a visitor made things happen, so a selection made while an
  // exit played is absorbed by the machine before the completion commits.
  const [exitDone, setExitDone] = useState(false);
  if (exitDone) {
    setExitDone(false);
    dispatchSwap({ type: "exitCompleted", filtered: filteredItems });
  }

  // The swap's animation side. Runs when the phase turns (exit starts) or
  // the commit lands (enter starts) — and on mount, where the enter is
  // simply the page-load entrance the listing has always played.
  // revertOnUpdate cuts an in-flight enter the moment an exit is raised:
  // it carries no completion, so a cut enter can never commit — the cards
  // it was rising are the same ones the exit then clears.
  const listRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const list = listRef.current;
      if (!list) return;

      if (swap.exiting) {
        const cards = list.querySelectorAll<HTMLElement>("[data-work-card-id]");
        // The machine only raises an exit over a stage holding cards; if
        // that invariant ever breaks, raise the completion anyway rather
        // than stick inert and empty forever.
        if (cards.length === 0) {
          setExitDone(true);
          return;
        }
        gsap.fromTo(
          cards,
          { opacity: 1, y: 0 },
          {
            opacity: 0,
            y: -16,
            duration: 0.3,
            ease: "swipe",
            overwrite: "auto",
            // No payload here — the commit reads this render's fresh set.
            onComplete: () => setExitDone(true),
          },
        );
        return;
      }

      // The enter: the freshly committed set arrives — the empty state
      // riding the same rise as the cards it stands in for.
      const arrivals = list.querySelectorAll<HTMLElement>(
        "[data-work-card-id], [data-works-empty]",
      );
      if (arrivals.length === 0) return;
      gsap.fromTo(
        arrivals,
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
    },
    { dependencies: [swap.exiting, swap.shown], revertOnUpdate: true },
  );

  const mainRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mx-auto min-h-screen flex flex-col lg:grid w-full lg:grid-cols-[minmax(0,min(25%,500px))_1fr]">
      <ScrollProgress scope={mainRef} />
      {/* The lg+ sticky top already seats the aside clear of the overlaid
          navbar (sticky pushes down to its offset); below lg it is static
          above the single column, so the padding supplies that clearance
          there instead. */}
      <aside className="self-start lg:pb-6 md:px-12 px-6 max-lg:pt-32 lg:sticky lg:top-32">
        {/* A div, not a nav: the filter buttons are controls, not links. */}
        <div className="lg:space-y-12">
          <div className="w-full space-y-4 border-b border-neutral-900 pb-12">
            <h1 className="block text-4xl font-bold text-neutral-50">
              Our Works
            </h1>
            <p className="block text-xl text-neutral-500">
              Ambitious ideas for ambitious business
            </p>
          </div>
          <div className="space-y-8">
            <p className="text-white text-base hidden lg:visible">
              Filter Works
            </p>
            {filterable && (
              <ul className="max-lg:hidden space-y-4">
                {[null, ...sectorOptions].map((sector) => {
                  const active = activeSector === (sector?.slug ?? null);
                  return (
                    <li key={sector?.slug ?? "all"}>
                      <button
                        aria-pressed={active}
                        className={`group flex w-full items-center text-left text-xl transition-colors ${
                          active
                            ? "text-primary-500"
                            : "text-neutral-800 hover:text-white focus-visible:text-white"
                        }`}
                        onClick={() => selectSector(sector?.slug ?? null)}
                        type="button"
                      >
                        <ArrowPush active={active} hover="slide" />
                        {sector?.name ?? "All"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </aside>

      <div className="w-full" ref={mainRef}>
        {/* The phone/tablet Sector Filter (CONTEXT.md): a fixed bar at the
            viewport's bottom edge raising the Sector list in the shared
            Bottom Sheet. Fixed, so unlike the pill bar it replaced it needs
            no particular containing block and renders from the root.
            Selection state stays here — the component owns only the sheet. */}
        {filterable && (
          <SectorFilter
            activeSector={activeSector}
            onSelect={selectSector}
            sectors={sectorOptions}
          />
        )}
        {/* The list wrapper is the swap's query scope: whatever phase is
            live, its targets — cards or the empty state — are found here. */}
        <div ref={listRef}>
          {swap.shown.length === 0 ? (
            <p className="p-8 text-xl text-neutral-600" data-works-empty>
              Works coming soon
            </p>
          ) : (
            <div
              className="flex w-full flex-col gap-1 lg:flex-row"
              // The departing stage is inert, not merely dimmed: the exit
              // plays on cards whose destination is already decided, so no
              // click, focus, or hover may re-enter them mid-flight.
              inert={swap.exiting}
            >
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
