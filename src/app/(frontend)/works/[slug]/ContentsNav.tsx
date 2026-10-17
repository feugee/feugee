"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

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
}) => {
  const handleScroll = (
    event: React.MouseEvent<HTMLAnchorElement>,
    anchor: string
  ) => {
    event.preventDefault();
    event.stopPropagation();
    onSelect?.();

    const target = document.getElementById(anchor);
    if (!target) return;

    const currentScroll = window.scrollY;
    const targetTop = target.getBoundingClientRect().top + currentScroll;
    const distance = Math.abs(currentScroll - targetTop);

    // Koto formula: adaptive duration based on travel distance (1.2s - 2.8s)
    const duration = Math.max(1.2, Math.min(2.8, distance / 800));

    // Koto's power2.inOut (quad ease-in-out)
    const power2InOut = (t: number) =>
      t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const smooth = getSmoothScroll();
    if (smooth) {
      smooth.start();
      smooth.scrollTo(target, {
        duration,
        easing: power2InOut,
        lock: true,
      });
    } else {
      target.scrollIntoView({ behavior: "smooth" });
    }

    window.history.pushState(null, "", `#${anchor}`);
  };

  return (
    <ul className={`space-y-4 ${className ?? ""}`}>
      {sections.map((section, index) => {
        const anchor = sectionAnchor(index);
        const active = activeSection === anchor;
        return (
          <li key={section.id ?? index}>
            <a
              aria-current={active ? "true" : undefined}
              className={`group flex items-center text-base lg:text-xl transition-colors ${
                active
                  ? "text-primary-500 font-medium"
                  : "text-neutral-700 hover:text-white focus-visible:text-white font-normal"
              }`}
              href={`#${anchor}`}
              onClick={(event) => handleScroll(event, anchor)}
            >
              <ArrowPush active={active} hover={false} />
              {section.title}
            </a>
          </li>
        );
      })}
    </ul>
  );
};

/**
 * The phone/tablet face of the Contents (CONTEXT.md): a frosted bar pinned
 * 24px off the viewport's bottom edges once the Hero is fully past —
 * "Contents" hugging its label, the Active Section named beside it — that
 * raises the shared Bottom Sheet carrying the Section list. The bar's shown
 * state lives on it as a data-shown attribute the ScrollTrigger flips (the
 * Back to Top ride); React state is reserved for the sheet. Hiding the bar
 * closes the sheet: it cannot outlive its trigger. Every close — the X,
 * the veil, Escape, picking a Section — funnels through closeSheet, which
 * lands focus back on the bar: a jump must not leave focus behind the list
 * that called it. z-order: above the page and the Navbar's frost, below
 * the Menu, the Blackout, and the Cursor.
 */
/**
 * The phone/tablet face of the Contents (CONTEXT.md): a fluid morphing bar pinned
 * 24px off the viewport's bottom edges.
 *
 * Appears immediately with a smooth fade-in & slide-up animation upon landing on the
 * work detail page, stays persistent during content exploration, and smoothly fades
 * out downward only when the user scrolls down to the Contact CTA / footer.
 *
 * When clicked, the container morphs upward from a compact 50px frosted glass bar
 * into a solid black (bg-neutral-950) full contents sheet with a synchronized 500ms
 * ease-swipe transition.
 */
export const ContentsNav = ({
  activeSection,
  sections,
}: {
  activeSection: string | null;
  heroRef?: RefObject<HTMLDivElement | null>;
  sections: WorkSectionsList;
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

    // Initial appear animation: starts from translate-y-6 opacity-0,
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

  if (!sections.length) return null;

  const activeTitle =
    sections.find((section, index) => sectionAnchor(index) === activeSection)
      ?.title ?? sections[0].title;

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
        aria-label="Table of Contents"
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
              Contents
            </span>
            <span aria-hidden="true" className="h-4 w-px shrink-0 bg-neutral-800" />
            <span className="min-w-0 flex-1 truncate text-sm text-primary-500 font-normal">
              {activeTitle}
            </span>
          </div>

          {/* Toggle / Close Icon */}
          <button
            aria-label={open ? "Close contents" : "Open contents"}
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

        {/* Expandable Content Grid: Smooth CSS Grid Accordion */}
        <div
          className={`grid transition-[grid-template-rows] duration-500 ease-swipe ${
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden min-h-0">
            <div
              className={`transition-[opacity,transform] ease-swipe ${
                open
                  ? "opacity-100 translate-y-0 delay-100 duration-400 pointer-events-auto"
                  : "opacity-0 -translate-y-2 duration-200 pointer-events-none"
              }`}
            >
              <ContentsLinks
                activeSection={activeSection}
                className="max-h-[calc(65svh-50px)] overflow-y-auto overscroll-contain p-4 pb-6 mask-[linear-gradient(to_bottom,black_calc(100%-24px),transparent)]"
                onSelect={closeSheet}
                sections={sections}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
