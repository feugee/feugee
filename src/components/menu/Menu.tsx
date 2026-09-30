"use client";

import Link from "next/link";
import { useEffect, useRef, type RefObject } from "react";

import { getSmoothScroll } from "@/components/SmoothScroll";
import { navigateWithBlackout } from "@/components/page-transition/navigateWithBlackout";
import { SwipeText } from "@/components/SwipeText";

import { menuItemTransition } from "./menuItemTransition";
import type { MenuLink } from "./menuLinks";
import { menuPanelTransition, menuVeilTransition } from "./menuPanelTransition";

/**
 * The Menu itself (CONTEXT.md): the panel sliding full-height from the
 * viewport's right edge — the Navbar's bar giving up the panel's column
 * while keeping its left anchor, the logo stays put (same ride, so the
 * bar's right edge stays flush with the panel's left; see globals.css) —
 * wearing the frosted glass the scrolled Navbar wears, above the dimmed
 * veil that stills the page beneath it (Navbar above the veil, content below it;
 * the Blackout and Cursor still outrank both). Escape and a press outside
 * the panel close it — the control's own press excepted, its click toggles
 * — a link click closes ahead of the navigation, a history traversal
 * (Back/Forward) closes on its popstate, and the page's scroll stops
 * behind Lenis while open. The items stagger up inside the panel, exactly
 * as they always have.
 */
export const Menu = ({
  controlRef,
  links,
  onClose,
  open,
}: {
  controlRef: RefObject<HTMLButtonElement | null>;
  links: MenuLink[];
  onClose: () => void;
  open: boolean;
}) => {
  const panelRef = useRef<HTMLUListElement>(null);

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
          motion still in flight. */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-[35] bg-neutral-950/60 ${menuVeilTransition(open)}`}
      />
      <ul
        className={`fixed inset-y-0 right-0 z-[55] flex w-(--menu-width) flex-col gap-y-2 border-l border-neutral-700 bg-neutral-950/70 px-6 pt-(--navbar-height) backdrop-blur-[8px] ${menuPanelTransition(open)}`}
        id="site-menu"
        ref={panelRef}
      >
        {links.map((link, index) => {
          const { className, transitionDelay } = menuItemTransition(
            open,
            index,
          );
          return (
            <li className={className} key={link.id} style={{ transitionDelay }}>
              <Link
                className="group text-xl text-neutral-50"
                href={link.url}
                onClick={onClose}
                onNavigate={(event) => navigateWithBlackout(event, link.url)}
              >
                <SwipeText>{link.label}</SwipeText>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
};
