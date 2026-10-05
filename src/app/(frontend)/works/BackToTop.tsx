"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

import { ArrowUp } from "@/components/ArrowUp";
import { getSmoothScroll } from "@/components/SmoothScroll";

gsap.registerPlugin(ScrollTrigger);

/**
 * The Back to Top control (CONTEXT.md): the circular white button pinned to
 * the viewport's bottom-right on the Works Page — riding above the Sector
 * Filter's bar on phone and tablet — rendered by the page only
 * while the listing is long — the same list-length threshold that admits
 * the Sector filter, with none of its Sector requirements. It stays hidden
 * at the top of the page: a ScrollTrigger admits it one viewport down and
 * recalls it near the top, the same onEnter/onLeaveBack toggle the
 * Navbar's frost rides. The shown state lives on the button as a
 * data-shown attribute the trigger flips — React state here would be a
 * synchronous setState in an effect for a value only the DOM needs.
 *
 * The show/hide is a plain CSS fade-and-rise on the site's swipe curve —
 * no GSAP tween to revert. visibility, not display, does the hiding: it
 * flips at the fade's end when leaving and at its start when arriving,
 * which also keeps the hidden button out of the tab order and beyond
 * pointers. The fill is the Scroll Cue's difference trick (ADR 0006): the
 * white circle inverts whatever passes behind it while the black arrow
 * rides as the page itself, un-inverted. Clicking hands the travel to
 * Lenis (ADR 0004); the native fallback smooths on its own. The Sector
 * Filter is deliberately untouched — the control's job is positional, not
 * editorial.
 */
export const BackToTop = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const show = (shown: boolean) =>
      button.toggleAttribute("data-shown", shown);
    const trigger = ScrollTrigger.create({
      // One viewport down — the top of the page is genuinely behind the
      // visitor, not merely a scroll-length away. A function-based start
      // keeps the threshold honest through resizes.
      start: () => window.innerHeight,
      end: "+=1",
      onEnter: () => show(true),
      onLeaveBack: () => show(false),
    });
    // A restored scroll position can start past the threshold — apply the
    // verdict now rather than wait for the first toggle.
    show(trigger.scroll() >= trigger.start);
    return () => trigger.kill();
  }, []);

  const scrollTop = () => {
    const smooth = getSmoothScroll();
    if (smooth) smooth.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      aria-label="Back to top"
      className="fixed right-6 bottom-24 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-white text-black mix-blend-difference hover:text-primary-500 focus-visible:text-primary-500 invisible translate-y-2 opacity-0 data-shown:visible data-shown:translate-y-0 data-shown:opacity-100 transition-[opacity,transform,visibility] duration-[400ms] ease-swipe lg:bottom-6"
      onClick={scrollTop}
      ref={buttonRef}
      type="button"
    >
      <ArrowUp />
    </button>
  );
};
