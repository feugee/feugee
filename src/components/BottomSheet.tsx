"use client";

import { useEffect, type ReactNode } from "react";

import { getSmoothScroll } from "@/components/SmoothScroll";

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
 * The Bottom Sheet (CONTEXT.md): a panel rising from the viewport's bottom
 * edge over a dimmed veil — a phone-and-tablet shape (hence the hardcoded
 * lg:hidden), shared by every surface that opens its list this way: the
 * Work Detail Page's Contents, the Works Page's Sector Filter. Controlled
 * by `open` alone; the sheet asks `onClose` from its X, the veil, and
 * Escape, and stills Lenis while raised — the Menu's own bargain. The
 * trigger owns focus: its `onClose` is where closing lands focus back on
 * the control that raised the sheet. The body arrives as children and owns
 * its padding and scroll height. z-order: above the page and the Navbar's
 * frost, below the Menu, the Blackout, and the Cursor.
 */
export const BottomSheet = ({
  children,
  id,
  onClose,
  open,
  title,
}: {
  children: ReactNode;
  /** The stage's id — the trigger's aria-controls points here. */
  id: string;
  onClose: () => void;
  open: boolean;
  title: string;
}) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    // The page stills behind the sheet.
    getSmoothScroll()?.stop();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      getSmoothScroll()?.start();
    };
  }, [onClose, open]);

  return (
    // The wrapper is the sheet's stage, never a hit target itself — the
    // surfaces opt into pointers, so the closed stage lets the page
    // through.
    <div
      aria-label={title}
      aria-modal="true"
      className="pointer-events-none fixed inset-0 z-50 lg:hidden"
      id={id}
      role="dialog"
    >
      <div
        aria-hidden="true"
        className={`pointer-events-auto absolute inset-0 bg-neutral-950/60 ${veilRide(open)}`}
        onClick={onClose}
      />
      <div
        className={`pointer-events-auto absolute inset-x-6 bottom-6 rounded-[4px] border border-neutral-700 bg-neutral-950/70 backdrop-blur-md ${sheetRide(open)}`}
      >
        <div className="flex items-center justify-between border-b border-neutral-900 px-4 py-3">
          <span className="text-lg text-neutral-50">{title}</span>
          <button
            aria-label="Close"
            className="-mr-1 flex h-8 w-8 items-center justify-center text-neutral-50 transition-colors duration-300 hover:text-primary-500 focus-visible:text-primary-500"
            onClick={onClose}
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
        {children}
      </div>
    </div>
  );
};
