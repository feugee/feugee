"use client";

import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import { ArrowPush } from "@/components/ArrowPush";
import { getSmoothScroll } from "@/components/SmoothScroll";
import type { Work } from "@/payload-types";

import { sectionAnchor } from "./WorkSections";

gsap.registerPlugin(ScrollTrigger);

export type WorkSectionsList = NonNullable<Work["sections"]>;

// The Contents list body shared by the desktop sidebar and the mobile
// sheet — the scroll-spy highlight reads the same in both. onSelect rides
// the links where a surface needs to react to a jump (the sheet closes);
// the sidebar passes nothing.
export const ContentsLinks = ({
  activeSection,
  className,
  onSelect,
  sections,
}: {
  activeSection: string | null;
  className?: string;
  onSelect?: () => void;
  sections: WorkSectionsList;
}) => (
  <ul className={`space-y-4 ${className ?? ""}`}>
    {sections.map((section, index) => {
      const anchor = sectionAnchor(index);
      const active = activeSection === anchor;
      return (
        <li key={section.id ?? index}>
          <Link
            aria-current={active ? "true" : undefined}
            className={`group flex items-center text-xl transition-colors ${
              active
                ? "text-primary-500"
                : "text-neutral-800 hover:text-white focus-visible:text-white"
            }`}
            href={`#${anchor}`}
            onClick={onSelect}
          >
            <ArrowPush active={active} hover="slide" />
            {section.title}
          </Link>
        </li>
      );
    })}
  </ul>
);

// The Menu's transition grammar, bottom-sheet shaped: 400ms to arrive on
// the site's swipe curve, 200ms to leave — dismissal shouldn't make the
// visitor wait — and visibility rides along, so a closed surface releases
// input only after its exit finishes. Literal strings throughout —
// Tailwind only generates the classes it can read in source.
const veilRide = (open: boolean): string =>
  `transition-[opacity,visibility] ease-swipe ${
    open
      ? "duration-[400ms] opacity-100 visible"
      : "duration-[200ms] opacity-0 invisible"
  }`;

const sheetRide = (open: boolean): string =>
  `transition-[translate,visibility] ease-swipe ${
    open
      ? "duration-[400ms] translate-y-0 visible"
      : "duration-[200ms] translate-y-[calc(100%+1.5rem)] invisible"
  }`;

/**
 * The phone/tablet face of the Contents (CONTEXT.md): a frosted bar pinned
 * 24px off the viewport's bottom edges once the Hero is fully past —
 * "Contents" hugging its label, the Active Section named beside it — that
 * raises a separate sheet over a dimmed veil, carrying the Section list.
 * The bar's shown state lives on it as a data-shown attribute the
 * ScrollTrigger flips (the Back to Top ride); React state is reserved for
 * the sheet, which is more than a DOM toggle — Escape, focus, and Lenis
 * stop with it. Hiding the bar closes the sheet: it cannot outlive its
 * trigger. The sheet closes from its X (focus returning to the bar), the
 * veil, Escape, or picking a Section — a jump must not land behind the
 * list that called it. z-order: above the page and the Navbar's frost,
 * below the Menu, the Blackout, and the Cursor.
 */
export const ContentsNav = ({
  activeSection,
  heroRef,
  sections,
}: {
  activeSection: string | null;
  heroRef: RefObject<HTMLDivElement | null>;
  sections: WorkSectionsList;
}) => {
  const barRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const closeSheet = useCallback(() => {
    setOpen(false);
    barRef.current?.focus();
  }, []);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const show = (shown: boolean) => {
      bar.toggleAttribute("data-shown", shown);
      if (!shown) setOpen(false);
    };
    const hero = heroRef.current;
    // No Hero — nothing to get past, so the bar admits itself from the top.
    if (!hero) {
      show(true);
      return;
    }
    // The verdict reads live geometry and re-applies after every refresh:
    // fonts and images keep moving the Hero's bottom for a while, so a
    // create-time measurement would lie. The crossings between refreshes
    // stay with the trigger.
    const past = () => hero.getBoundingClientRect().bottom <= 0;
    show(past());
    const onRefresh = () => show(past());
    ScrollTrigger.addEventListener("refresh", onRefresh);
    const trigger = ScrollTrigger.create({
      end: "+=1",
      onEnter: () => show(true),
      onLeaveBack: () => show(false),
      start: "bottom top",
      trigger: hero,
    });
    return () => {
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      trigger.kill();
    };
  }, [heroRef]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      closeSheet();
    };
    document.addEventListener("keydown", onKeyDown);
    // The page stills behind the sheet — the Menu's own bargain.
    getSmoothScroll()?.stop();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      getSmoothScroll()?.start();
    };
  }, [closeSheet, open]);

  if (!sections.length) return null;

  const activeTitle =
    sections.find((section, index) => sectionAnchor(index) === activeSection)
      ?.title ?? sections[0].title;

  return (
    <>
      <button
        aria-controls="contents-sheet"
        aria-expanded={open}
        className="fixed inset-x-6 bottom-6 z-45 flex items-center gap-3 rounded-[4px] border border-neutral-700 bg-neutral-950/70 px-4 py-3 text-left backdrop-blur-md invisible translate-y-4 opacity-0 data-shown:visible data-shown:translate-y-0 data-shown:opacity-100 transition-[opacity,translate,visibility] duration-[400ms] ease-swipe lg:hidden"
        onClick={() => setOpen(true)}
        ref={barRef}
        type="button"
      >
        <span className="shrink-0 text-lg text-neutral-50">Contents</span>
        <span aria-hidden="true" className="h-4 w-px shrink-0 bg-neutral-800" />
        <span className="min-w-0 flex-1 truncate text-lg text-primary-500">
          {activeTitle}
        </span>
        <span aria-hidden="true" className="shrink-0 text-neutral-50">
          <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
            <path
              d="M3 10l5-5 5 5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        </span>
      </button>

      {/* The wrapper is the sheet's stage, never a hit target itself — the
          surfaces opt into pointers, so the closed stage lets the page
          through. */}
      <div
        aria-label="Contents"
        aria-modal="true"
        className="pointer-events-none fixed inset-0 z-50 lg:hidden"
        id="contents-sheet"
        role="dialog"
      >
        <div
          aria-hidden="true"
          className={`pointer-events-auto absolute inset-0 bg-neutral-950/60 ${veilRide(open)}`}
          onClick={() => setOpen(false)}
        />
        <div
          className={`pointer-events-auto absolute inset-x-6 bottom-6 rounded-[4px] border border-neutral-700 bg-neutral-950/70 backdrop-blur-md ${sheetRide(open)}`}
        >
          <div className="flex items-center justify-between border-b border-neutral-900 px-4 py-3">
            <span className="text-lg text-neutral-50">Contents</span>
            <button
              aria-label="Close"
              className="-mr-1 flex h-8 w-8 items-center justify-center text-neutral-50 transition-colors duration-300 hover:text-primary-500 focus-visible:text-primary-500"
              onClick={closeSheet}
              type="button"
            >
              <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.5"
                />
              </svg>
            </button>
          </div>
          <ContentsLinks
            activeSection={activeSection}
            className="max-h-[60svh] overflow-y-auto p-4"
            onSelect={() => setOpen(false)}
            sections={sections}
          />
        </div>
      </div>
    </>
  );
};
