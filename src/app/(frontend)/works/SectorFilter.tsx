"use client";

import { useCallback, useRef, useState } from "react";

import { ArrowPush } from "@/components/ArrowPush";
import { BottomSheet } from "@/components/BottomSheet";

import type { SectorOption } from "./WorksListing";

/**
 * The phone/tablet face of the Sector Filter (CONTEXT.md): a frosted bar
 * pinned 24px off the viewport's bottom edges for as long as the filter
 * exists — "Filter" hugging its label, the current Sector (or "All") named
 * beside it — that raises the shared Bottom Sheet carrying the Sector list.
 * The bar is always on show: with no Hero to get past, the filter is a
 * primary affordance from the first viewport. The sheet's rows are the
 * desktop sidebar's verbatim — Arrow Push, arrow current-only — so all
 * three faces of the filter read as one control. Filter state lives in
 * WorksListing (it owns the ?sector= sync); this component owns only the
 * sheet, and every close lands focus back on the bar. z-order: above the
 * page and the Navbar's frost, below the Menu, the Blackout, and the
 * Cursor.
 */
export const SectorFilter = ({
  activeSector,
  onSelect,
  sectors,
}: {
  activeSector: string | null;
  onSelect: (slug: string | null) => void;
  sectors: SectorOption[];
}) => {
  const barRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const closeSheet = useCallback(() => {
    setOpen(false);
    barRef.current?.focus();
  }, []);

  const activeName =
    sectors.find((sector) => sector.slug === activeSector)?.name ?? "All";

  return (
    <>
      <button
        aria-controls="sector-filter-sheet"
        aria-expanded={open}
        className="fixed inset-x-6 bottom-6 z-45 flex items-center gap-3 rounded-[4px] border border-neutral-700 bg-neutral-950/70 px-4 py-3 text-left backdrop-blur-md lg:hidden"
        onClick={() => setOpen(true)}
        ref={barRef}
        type="button"
      >
        <span className="shrink-0 text-lg text-neutral-50">Filter</span>
        <span aria-hidden="true" className="h-4 w-px shrink-0 bg-neutral-800" />
        <span className="min-w-0 flex-1 truncate text-lg text-primary-500">
          {activeName}
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

      <BottomSheet
        id="sector-filter-sheet"
        onClose={closeSheet}
        open={open}
        title="Filter"
      >
        <ul className="max-h-[60svh] space-y-4 overflow-y-auto p-4">
          {[null, ...sectors].map((sector) => {
            const active = activeSector === (sector?.slug ?? null);
            return (
              <li key={sector?.slug ?? "all"}>
                <button
                  aria-pressed={active}
                  className={`group flex w-full items-center text-left text-xl transition-colors ${
                    active
                      ? "text-primary-500"
                      : "text-neutral-800 hover:text-white focus-visible:text-white"
                  }`}
                  onClick={() => {
                    onSelect(sector?.slug ?? null);
                    closeSheet();
                  }}
                  type="button"
                >
                  <ArrowPush active={active} hover="slide" />
                  {sector?.name ?? "All"}
                </button>
              </li>
            );
          })}
        </ul>
      </BottomSheet>
    </>
  );
};
