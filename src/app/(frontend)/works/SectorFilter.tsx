"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useRef, useState } from "react";

import { ArrowPush } from "@/components/ArrowPush";
import { getSmoothScroll } from "@/components/SmoothScroll";

import type { SectorOption } from "./WorksListing";

gsap.registerPlugin(ScrollTrigger);

/**
 * The phone/tablet face of the Sector Filter (CONTEXT.md): a fluid morphing bar
 * pinned 24px off the viewport's bottom edges.
 *
 * Appears immediately with a smooth fade-in & slide-up animation upon landing on
 * the catalog page, stays persistent during work exploration, and smoothly fades
 * out downward only when the user scrolls down to the Contact CTA / footer.
 *
 * When clicked, the container morphs upward from a compact 50px frosted glass bar
 * into a solid black (bg-neutral-950) full sector filter sheet with a synchronized
 * 500ms ease-swipe transition.
 */
export const SectorFilter = ({
  activeSector,
  onSelect,
  sectors,
}: {
  activeSector: string | null;
  onSelect: (slug: string | null) => void;
  sectors: SectorOption[];
}) => {
  const barRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [isShown, setIsShown] = useState(false);

  const closeSheet = useCallback(() => {
    setOpen(false);
    barRef.current?.focus();
  }, []);

  // Lock smooth scroll during open state
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSheet();
    };
    document.addEventListener("keydown", onKeyDown);
    getSmoothScroll()?.stop();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      getSmoothScroll()?.start();
    };
  }, [closeSheet, open]);

  // ScrollTrigger: Appears immediately upon landing, only hides at CTA / bottom
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const show = (shown: boolean) => {
      setIsShown(shown);
      bar.toggleAttribute("data-shown", shown);
      if (!shown) setOpen(false);
    };

    const getCtaElement = () =>
      document.getElementById("contact-cta") ||
      document.getElementById("site-footer") ||
      document.querySelector('section[aria-label="Contact CTA"]') ||
      document.querySelector("footer");

    // Only hides once scroll reaches the Contact CTA / footer
    const isAboveCta = () => {
      const cta = getCtaElement();
      return !cta || cta.getBoundingClientRect().top > window.innerHeight;
    };

    // Initial appear animation: starts from translate-y-10 opacity-0,
    // then slides up and fades in smoothly on page entrance.
    const appearTimer = setTimeout(() => {
      show(isAboveCta());
    }, 60);

    const onRefresh = () => show(isAboveCta());
    ScrollTrigger.addEventListener("refresh", onRefresh);

    const cta = getCtaElement();
    const trigger = ScrollTrigger.create({
      trigger: cta ?? undefined,
      start: "top bottom",
      onEnter: () => show(false),
      onLeaveBack: () => show(true),
    });

    return () => {
      clearTimeout(appearTimer);
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      trigger.kill();
    };
  }, []);

  const activeName =
    sectors.find((sector) => sector.slug === activeSector)?.name ?? "All";

  return (
    <>
      {/* Dimmed Backdrop Veil */}
      <div
        aria-hidden="true"
        className={`pointer-events-auto fixed inset-0 z-40 bg-neutral-950/60 backdrop-blur-[2px] transition-[opacity,visibility] duration-500 ease-swipe lg:hidden ${
          open ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        onClick={closeSheet}
      />

      {/* Fluid Morphing Container */}
      <div
        aria-expanded={open}
        aria-label="Filter Works"
        className={`fixed inset-x-6 bottom-6 z-45 overflow-hidden transition-[opacity,translate,border-radius,box-shadow,background-color,border-color,backdrop-filter,visibility] duration-500 ease-swipe lg:hidden ${
          !isShown
            ? "invisible translate-y-10 opacity-0 pointer-events-none"
            : "visible translate-y-0 opacity-100"
        } ${
          open
            ? "rounded-[8px] border border-neutral-700 bg-neutral-950 backdrop-blur-none shadow-2xl"
            : "rounded-[4px] border border-neutral-700/80 bg-neutral-950/70 backdrop-blur-md shadow-lg cursor-pointer"
        }`}
        data-lenis-prevent
        ref={barRef}
      >
        {/* Header Row */}
        <div
          className={`flex items-center justify-between px-4 h-[50px] shrink-0 transition-colors duration-500 ${
            open ? "border-b border-neutral-900" : ""
          }`}
          onClick={() => {
            if (!open) setOpen(true);
          }}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="shrink-0 text-sm font-sans uppercase text-neutral-500 font-medium">
              Filter
            </span>
            <span aria-hidden="true" className="h-4 w-px shrink-0 bg-neutral-800" />
            <span className="min-w-0 flex-1 truncate text-sm text-primary-500 font-normal">
              {activeName}
            </span>
          </div>

          {/* Toggle / Close Icon */}
          <button
            aria-label={open ? "Close filter" : "Open filter"}
            className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded text-neutral-400 hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
            type="button"
          >
            <svg
              className={`h-4 w-4 transition-transform duration-500 ease-swipe ${
                open ? "rotate-90 text-primary-500" : "rotate-0 text-neutral-300"
              }`}
              fill="none"
              viewBox="0 0 16 16"
            >
              {open ? (
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.5"
                />
              ) : (
                <path
                  d="M3 10l5-5 5 5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Expandable Sector List Grid: Smooth CSS Grid Accordion */}
        <div
          className={`grid transition-[grid-template-rows] duration-500 ease-swipe ${
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden min-h-0">
            <div
              className={`transition-[opacity,translate] duration-500 ease-swipe ${
                open
                  ? "opacity-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 translate-y-3 pointer-events-none"
              }`}
            >
              <ul className="max-h-[calc(65svh-50px)] space-y-2 overflow-y-auto overscroll-contain p-4 pb-6 mask-[linear-gradient(to_bottom,black_calc(100%-24px),transparent)]">
                {[null, ...sectors].map((sector) => {
                  const active = activeSector === (sector?.slug ?? null);
                  return (
                    <li key={sector?.slug ?? "all"}>
                      <button
                        aria-pressed={active}
                        className={`group flex w-full items-center text-left text-sm font-sans transition-colors py-1.5 ${
                          active
                            ? "text-primary-500 font-medium"
                            : "text-neutral-700 hover:text-white font-normal"
                        }`}
                        onClick={() => {
                          onSelect(sector?.slug ?? null);
                          closeSheet();
                        }}
                        type="button"
                      >
                        <ArrowPush active={active} hover={false} />
                        {sector?.name ?? "All"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
