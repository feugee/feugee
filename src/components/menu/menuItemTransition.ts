/** The pause between one Menu item swiping in and the next, in ms. */
export const MENU_ITEM_STAGGER_MS = 60;

/**
 * The per-item open/close motion of the Menu's panel. Opening staggers:
 * each item swipes up into place one stagger step behind the one above it,
 * riding the site's swipe curve. Closing drops every item out together —
 * full offset, a fifth of a second, no delay — because dismissal shouldn't
 * make the visitor wait.
 */
export const menuItemTransition = (
  open: boolean,
  index: number,
): { className: string; transitionDelay: string } => ({
  // The durations stay literal on purpose: Tailwind only generates the
  // classes it can read in source, so they can't ride an interpolated template.
  className: open
    ? "transition ease-swipe duration-[400ms] translate-y-0 opacity-100"
    : "transition ease-swipe duration-[200ms] translate-y-full opacity-0",
  transitionDelay: open ? `${index * MENU_ITEM_STAGGER_MS}ms` : "0ms",
});
