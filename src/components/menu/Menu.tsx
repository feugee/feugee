"use client";

import Link from "next/link";
import { useEffect, useRef, type RefObject } from "react";

import { ArrowPush } from "@/components/ArrowPush";
import { getSmoothScroll } from "@/components/SmoothScroll";
import { navigateWithBlackout } from "@/components/page-transition/navigateWithBlackout";
import { toSocialLinks } from "@/components/socialPlatforms";
import type { Footer } from "@/payload-types";

import { menuIconLine } from "./menuIcon";
import { menuItemTransition } from "./menuItemTransition";
import type { MenuLink } from "./menuLinks";
import { menuPanelTransition, menuVeilTransition } from "./menuPanelTransition";

/**
 * The Menu itself (CONTEXT.md): on desktop, the panel sliding full-height
 * from the viewport's right edge — the Navbar's bar giving up the panel's
 * column while keeping its left anchor, the logo stays put (same ride, so
 * the bar's right edge stays flush with the panel's left; see globals.css) —
 * wearing the frosted glass the scrolled Navbar wears, above the dimmed
 * veil that stills the page beneath it (Navbar above the veil, content
 * below it; the Blackout and Cursor still outrank both). On a phone or
 * tablet the panel is the full viewport at the front of the page: the bar
 * keeps its shape beneath it, and the panel carries its own X — the
 * control's open-state glyph parked where the control sits — because that
 * control is unreachable behind the glass. Escape and — on desktop, where
 * the veil is reachable — a press outside the panel close it — the
 * control's own press excepted, its click toggles — a link click closes
 * ahead of the navigation, a history traversal (Back/Forward) closes on
 * its popstate, and the page's scroll stops behind Lenis while open. The
 * items are edge-to-edge rows flush one atop the next, riding Arrow Push's
 * arrow on hover — the Menu knows no current item — and they stagger in
 * from the panel's right edge, riding the panel's own direction. The foot
 * pins the Footer's Social Links below a divider.
 */
export const Menu = ({
  controlRef,
  links,
  onClose,
  open,
  socialLinks,
}: {
  controlRef: RefObject<HTMLButtonElement | null>;
  links: MenuLink[];
  onClose: () => void;
  open: boolean;
  socialLinks: Footer["socialLinks"];
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  // Icons resolve here, inside the client boundary — components can't ride
  // server props (the same resolve FooterView does over its raw CMS rows).
  const socials = toSocialLinks(socialLinks);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      onClose();
      controlRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      // Only the panel counts as inside — the veil covering the page is
      // itself the dismissal surface. The control's press is the toggle's
      // own: closing here would have its click immediately reopen the
      // Menu.
      if (panelRef.current?.contains(target)) return;
      if (controlRef.current?.contains(target)) return;
      onClose();
    };
    // A history traversal swaps the page with no link click — the one
    // navigation whose close can't ride an onClick.
    const onPopState = () => onClose();
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("popstate", onPopState);
    getSmoothScroll()?.stop();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("popstate", onPopState);
      getSmoothScroll()?.start();
    };
  }, [controlRef, onClose, open]);

  return (
    <>
      {/* The visibility ride flips on instantly when opening and only
          after the fade's exit when closing, so the veil never hides a
          motion still in flight. On a phone or tablet the full-screen
          panel covers the veil — the veil exists for the desktop panel's
          exposed column. */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-35 bg-neutral-950/60 ${menuVeilTransition(open)}`}
      />
      <div
        className={`fixed inset-0 z-55 flex flex-col bg-neutral-950/70 pt-(--navbar-height) backdrop-blur-sm lg:inset-y-0 lg:left-auto lg:right-0 lg:w-(--menu-width) lg:border-l lg:border-neutral-700 ${menuPanelTransition(open)}`}
        ref={panelRef}
      >
        {/* The phone/tablet close: the Navbar's control sits behind the
            full-screen panel, so the panel carries the close itself — the
            control's open-state glyph, centered on the spot the control
            occupies in the bar (h-11 keeps a comfortable tap target; the
            3.5/5 offsets land its center on the bar's own). */}
        <button
          aria-label="Close"
          className="absolute right-5 top-3.5 flex h-11 w-11 items-center justify-center text-neutral-50 transition-colors duration-300 hover:text-primary-500 focus-visible:text-primary-500 lg:hidden"
          onClick={() => {
            onClose();
            controlRef.current?.focus();
          }}
          type="button"
        >
          <span
            aria-hidden="true"
            className="flex h-3 w-9 flex-col items-end justify-between"
          >
            <span className={menuIconLine(true, true)} />
            <span className={menuIconLine(true, false)} />
          </span>
        </button>
        <ul className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto" id="site-menu">
          {links.map((link, index) => {
            const { className, transitionDelay } = menuItemTransition(
              open,
              index,
            );
            return (
              <li
                className={className}
                key={link.id}
                style={{ transitionDelay }}
              >
                {/* The full-bleed row (CONTEXT.md): the hover block spans
                    the panel edge-to-edge and the rows stack with no
                    vertical gap — the panel's old px-6 lives inside each
                    row now. The label stays white; the Arrow Push arrow
                    carries the hover, and there is no current item. */}
                <Link
                  className="group flex items-center px-6 py-3 text-2xl lg:text-3xl xl:text-5xl lg:pl-12 text-neutral-50 font-semibold transition-colors hover:bg-neutral-900/20 focus-visible:bg-neutral-800"
                  href={link.url}
                  onClick={onClose}
                  onNavigate={(event) => navigateWithBlackout(event, link.url)}
                >
                  <ArrowPush active={false} size="lg" />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
        {socials.length > 0 && (
          <div className="shrink-0 px-6">
            <div className="h-px w-full bg-neutral-900" />
            {/* The Footer's Social Links row, verbatim — same CMS list, the
                same bordered squares — wrapped so a narrow viewport can
                never cut one off. */}
            <div className="flex flex-wrap justify-center items-center gap-x-3 px-6 py-12">
              {socials.map(({ id, url, label, Icon }) => (
                <a
                  aria-label={label}
                  className="rounded border border-neutral-900 p-2 text-neutral-500 transition-colors hover:border-primary-500 hover:text-primary-500"
                  href={url}
                  key={id}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
