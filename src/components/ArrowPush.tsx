import { ArrowRight } from "@/components/ArrowRight";

/**
 * Arrow Push (CONTEXT.md): a primary arrow slides in from the left,
 * pushing the label right — riding the wrapping element's hover and focus,
 * or parked out for good while the item is current (that recolor belongs
 * to the wrapping element). `hover` picks what the hover rides: "arrow"
 * slides the arrow in with the push (the Menu's items), "slide" pushes the
 * label over the arrow's empty slot — the motion without the glyph, the
 * Works Page's Sector filter and the Work Detail Page's Contents — and
 * `false` stills the hover entirely, leaving the arrow to the current item
 * alone.
 * The interactive element that wraps this owns the hover state, so it must
 * carry the `group` class (forgetting it means a silent no-op hover). The
 * slot rides max-width so the label's shift is real layout — the push —
 * while the arrow rides translate inside the clipped slot; both ride
 * group-hover and group-focus-visible, 400ms on the site's swipe curve.
 * The 28px slot (max-w-7) is the arrow plus its trailing gap,
 * so the wrapping element carries no gap of its own. `size` "lg" upsizes
 * both in step — a 20px arrow, the slot max-w-8 (32px) — for the Menu's
 * roomy rows; the default fits the site's inline text.
 */
export const ArrowPush = ({
  active,
  hover = "arrow",
  size = "base",
}: {
  active: boolean;
  /** What hover rides: "arrow" = arrow and push, "slide" = push alone (glyph hidden), false = nothing. */
  hover?: "arrow" | "slide" | false;
  /** "lg" pairs the 20px arrow with the wider slot; "base" is the site default. */
  size?: "base" | "lg";
}) => {
  const rides = hover !== false;
  const slot = active
    ? size === "lg"
      ? "max-w-12"
      : "max-w-7"
    : rides
      ? size === "lg"
        ? "max-w-0 group-hover:max-w-12 group-focus-visible:max-w-12"
        : "max-w-0 group-hover:max-w-7 group-focus-visible:max-w-7"
      : "max-w-0";
  const arrow = active
    ? "translate-x-0"
    : rides
      ? "-translate-x-full group-hover:translate-x-0 group-focus-visible:translate-x-0"
      : "-translate-x-full";
  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden text-primary-500
        transition-[max-width] duration-[400ms] ease-swipe ${slot}`}
    >
      <span
        className={`mr-3 inline-flex transition-transform duration-[400ms] ease-swipe
          ${active || hover === "arrow" ? "" : "text-transparent"} ${arrow}`}
      >
        <ArrowRight size={size} />
      </span>
    </span>
  );
};
