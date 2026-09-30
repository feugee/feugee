"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { LogoLink } from "./LogoLink";
import { Menu, MenuControl, type MenuLink } from "./menu";

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
 *
 * The header also carries [data-menu-open] while the Menu is open, which
 * retracts the bar's right edge out of the panel's column (globals.css) —
 * the logo keeps its anchor at the left — while the Menu panel and its
 * veil render as the header's siblings, so the header itself carries no
 * transform a CSS transition could fight the Blackout's Page Shift with.
 */
export const NavbarBar = ({ links }: { links: MenuLink[] }) => {
  const headerRef = useRef<HTMLElement>(null);
  const controlRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // Stable for the Menu's effect deps — a fresh identity would re-run its
  // scroll stop/start mid-open.
  const closeMenu = useCallback(() => setMenuOpen(false), []);
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
      end: "+=1",
      onEnter: () => setFrosted(true),
      onLeaveBack: () => setFrosted(false),
    });
    // A restored scroll position can start past the threshold — apply it
    // now rather than wait for the first toggle.
    setFrosted(trigger.scroll() >= trigger.start);

    return () => trigger.kill();
  }, [pathname]);

  return (
    <>
      {/* The negative margin cancels the header's flow footprint: page content
          starts at the very top and slides under the (transparent) navbar while
          it stays pinned. Sticky offsets and scroll margins elsewhere still hang
          off --navbar-height. */}
      {/* The data attributes mark the Page Shift slab (ADR 0007) and the
          Menu's push (globals.css). */}
      <header
        className="sticky top-0 z-40 -mb-(--navbar-height) h-(--navbar-height)"
        data-blackout-slab
        data-menu-open={menuOpen || undefined}
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
          <LogoLink />
          {links.length > 0 && (
            <MenuControl
              onToggle={() => setMenuOpen((current) => !current)}
              open={menuOpen}
              ref={controlRef}
            />
          )}
        </div>
      </header>
      {links.length > 0 && (
        <Menu
          controlRef={controlRef}
          links={links}
          onClose={closeMenu}
          open={menuOpen}
        />
      )}
    </>
  );
};
