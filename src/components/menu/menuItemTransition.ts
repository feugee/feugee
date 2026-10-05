/** The pause between one Menu item swiping in and the next, in ms. */
export const MENU_ITEM_STAGGER_MS = 60;

/**
 * The per-item open/close motion of the Menu's panel. Opening staggers:
 * each item swipes in from the panel's right edge — riding the panel's own
 * direction — one stagger step behind the one above it, on the site's swipe
 * curve. Closing sweeps every item out to the right together — full offset,
 * a fifth of a second, no delay — because dismissal shouldn't make the
 * visitor wait.
 */
export const menuItemTransition = (
  open: boolean,
  index: number,
): { className: string; transitionDelay: string } => ({
  // The durations stay literal on purpose: Tailwind only generates the
  // classes it can read in source, so they can't ride an interpolated template.
  className: open
    ? "transition ease-swipe duration-[400ms] translate-x-0 opacity-100"
    : "transition ease-swipe duration-[200ms] translate-x-full opacity-0",
  transitionDelay: open ? `${index * MENU_ITEM_STAGGER_MS}ms` : "0ms",
});
