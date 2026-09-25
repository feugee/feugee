"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { navigateWithBlackout } from "@/components/page-transition/navigateWithBlackout";
import { SwipeText } from "@/components/SwipeText";

import { menuIconLine } from "./menuIcon";
import { menuItemTransition } from "./menuItemTransition";
import type { MenuLink } from "./menuLinks";

/**
 * The Navbar's Menu control: a button toggling the site's primary navigation
 * from its icon — two lines, the lower 2/3 the upper's length and
 * right-justified — which on open grows both lines to equal length and
 * rotates them into a centered X (~300ms on the site's swipe curve). The
 * Menu/Close labels ride the button's aria-label; hover and focus swap the
 * lines to primary-500. Opening staggers the items up into place; closing
 * drops them out together. Escape and an outside press close it, and a link
 * click closes it ahead of the navigation. The items carry no panel of their
 * own — they sit directly over page content, which the site's mostly-dark
 * pages keep readable.
 */
export const Menu = ({ links }: { links: MenuLink[] }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-controls="site-menu"
        aria-expanded={open}
        aria-label={open ? "Close" : "Menu"}
        className="flex h-9 w-9 items-center justify-center text-neutral-50 transition-colors duration-300 hover:text-primary-500 focus-visible:text-primary-500"
        onClick={() => setOpen((current) => !current)}
        ref={buttonRef}
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
      {/* The visibility transition flips on instantly when opening and only
          after the items' shared exit when closing, so the panel never hides
          a motion still in flight. */}
      <ul
        className={`absolute right-0 top-full mt-2 flex flex-col gap-y-2 transition-[visibility] duration-200 motion-reduce:transition-none ${
          open ? "visible" : "invisible"
        }`}
        id="site-menu"
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
                onClick={() => setOpen(false)}
                onNavigate={(event) => navigateWithBlackout(event, link.url)}
              >
                <SwipeText>{link.label}</SwipeText>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
