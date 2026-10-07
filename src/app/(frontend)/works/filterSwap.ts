/**
 * The Filter Swap's state machine (CONTEXT.md) — how the works listing
 * exchanges as one clean stage when the Sector Filter changes.
 *
 * Two phases, strictly hand-off: whatever is on stage exits as one, and only
 * then does the freshly filtered set commit and enter. While the exit plays,
 * the departing set stays pinned as `shown` — the grid keeps rendering the
 * exact cards the exit tween is animating — and further selections are
 * absorbed: the completion commits whatever the newest selection filtered to.
 * An empty stage has nothing to clear, so its change commits straight to the
 * new set; an empty-to-empty change returns the same state so nothing — not
 * even the "coming soon" note — replays for no visible difference. A stage
 * nobody saw (the mount deep-link sync, resolving before the entrance has
 * shown a card) has nothing to clear either: it commits straight, so the
 * page-load entrance plays on the deep-linked set instead of swapping.
 */
export interface FilterSwapState<T> {
  /** What the listing renders: the committed filtered set, or the departing
   * set pinned while the exit plays. */
  shown: T[];
  /** True from the moment a filter change finds cards on stage until the
   * exit completes and the new set commits. */
  exiting: boolean;
}

export type FilterSwapEvent<T> =
  | { type: "sectorChanged"; filtered: T[]; unseenStage?: boolean }
  | { type: "exitCompleted"; filtered: T[] };

export function reduceFilterSwap<T>(
  state: FilterSwapState<T>,
  event: FilterSwapEvent<T>,
): FilterSwapState<T> {
  switch (event.type) {
    case "sectorChanged":
      // A stage nobody saw has nothing to clear — commit straight.
      if (event.unseenStage) return { shown: event.filtered, exiting: false };
      // Mid-exit selections don't restart the clear — the stage is already
      // leaving; completion reads the newest set.
      if (state.exiting) return state;
      if (state.shown.length > 0) return { ...state, exiting: true };
      if (event.filtered.length === 0) return state;
      return { ...state, shown: event.filtered, exiting: false };
    case "exitCompleted":
      // A completion from a swap that isn't running is stale — ignore it.
      if (!state.exiting) return state;
      return { shown: event.filtered, exiting: false };
  }
}
