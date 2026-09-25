"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

gsap.registerPlugin(ScrollTrigger);

// Hero-less pages frost once the visitor has scrolled at all — far enough
// that top-of-page jitter and overscroll can't flicker the toggle, near
// enough that the first intentional scroll morphs the bar.
const FROST_SCROLL_PX = 24;

/**
 * The Navbar's client shell (the server Navbar keeps fetching the Menu's
 * links): the sticky `<header>` plus the floating bar that carries the logo
 * and the Menu control. Every page starts with the bar transparent and
 * full-width at the top — over the Hero where there is one. The frosted
 * state — inset 24px left/top/right, 12px radius, translucent dark, blur,
 * hairline border, ~400ms (globals.css) — is a header attribute this
 * component toggles when the visitor scrolls: past the Hero's bottom on the
 * Landing Page, or past the small threshold above on hero-less pages.
 */
export const NavbarBar = ({ children }: { children: ReactNode }) => {
  const headerRef = useRef<HTMLElement>(null);
  // The trigger is keyed to the pathname: a client-side navigation swaps the
  // Hero for a new node (or for none), so every page rebuilds it.
  const pathname = usePathname();

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const setFrosted = (frosted: boolean) =>
      header.toggleAttribute("data-frosted", frosted);
    const hero = document.querySelector("[data-hero]");
    const trigger = ScrollTrigger.create({
      // With a Hero, the bar waits the Hero out: frosted once its bottom
      // crosses the top of the viewport. Without one, plain scroll
      // distance decides.
      ...(hero instanceof HTMLElement
        ? { trigger: hero, start: "bottom top" }
        : { start: FROST_SCROLL_PX }),
      end: "max",
      onToggle: (self) => setFrosted(self.isActive),
    });
    // A restored scroll position can start past the threshold — apply it
    // now rather than wait for the first toggle.
    setFrosted(trigger.isActive);

    return () => trigger.kill();
  }, [pathname]);

  return (
    /* The negative margin cancels the header's flow footprint: page content
       starts at the very top and slides under the (transparent) navbar while
       it stays pinned. Sticky offsets and scroll margins elsewhere still hang
       off --navbar-height. */
    /* The data attribute marks the Page Shift slab (ADR 0007). */
    <header
      className="sticky top-0 z-40 -mb-(--navbar-height) h-(--navbar-height)"
      data-blackout-slab
      ref={headerRef}
    >
      {/* The floating bar: absolutely positioned inside the fixed-height
          header, so frosting never touches page flow. It overhangs the
          header's box by its 24px top inset — pointer-events-none keeps the
          overhang transparent to input, and the stylesheet hands events back
          to the bar's children. The blur(0px) base keeps the frosting
          interpolable, the same trick as the Works cards' caption
          underlay. */}
      <div className="navbar-bar pointer-events-none absolute inset-x-0 top-0 flex h-(--navbar-height) items-center justify-between rounded-xl border border-transparent px-6 backdrop-blur-[0px]">
        {children}
      </div>
    </header>
  );
};
