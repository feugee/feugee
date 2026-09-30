"use client";

import type { Ref } from "react";

import { menuIconLine } from "./menuIcon";

/**
 * The Navbar's Menu control (the state lives one level up in NavbarBar,
 * which also renders the Menu it opens): a button toggling the site's
 * primary navigation from its icon — two lines, the lower 2/3 the upper's
 * length and right-justified — which on open grows both lines to equal
 * length and rotates them into a centered X (~300ms on the site's swipe
 * curve). The Menu/Close labels ride the button's aria-label; hover and
 * focus swap the lines to primary-500.
 */
export const MenuControl = ({
  onToggle,
  open,
  ref,
}: {
  onToggle: () => void;
  open: boolean;
  ref: Ref<HTMLButtonElement>;
}) => (
  <button
    aria-controls="site-menu"
    aria-expanded={open}
    aria-label={open ? "Close" : "Menu"}
    className="flex h-9 w-9 items-center justify-center text-neutral-50 transition-colors duration-300 hover:text-primary-500 focus-visible:text-primary-500"
    onClick={onToggle}
    ref={ref}
    type="button"
  >
    {/* The icon is aria-hidden — the button's aria-label carries the
        Menu/Close announcement. The 12px-tall stack parks each 2px line
        5px from the other's center, exactly the flight a centered X
        needs; the lower line keeps 2/3 the length closed, right-justified
        by items-end (see menuIcon.ts for the lines' own motion). */}
    <span
      aria-hidden="true"
      className="flex h-3 w-9 flex-col items-end justify-between"
    >
      <span className={menuIconLine(open, true)} />
      <span className={menuIconLine(open, false)} />
    </span>
  </button>
);
