import { ArrowRight } from "@/components/ArrowRight";

/**
 * Arrow Push (CONTEXT.md): a sidebar item's label sits flush left at rest;
 * on hover or when current, a primary arrow slides in from the left,
 * pushing the label right — the hovered label turns white, the current one
 * stays primary (that recolor belongs to the wrapping element). The
 * interactive element that wraps this owns the hover state, so it must
 * carry the `group` class (forgetting it means a silent no-op hover). The
 * slot rides max-width so the label's shift is real layout — the push —
 * while the arrow rides translate inside the clipped slot; both ride
 * group-hover and group-focus-visible, 400ms on the site's swipe curve.
 * The 28px slot (max-w-7) is the arrow plus its trailing gap,
 * so the wrapping element carries no gap of its own.
 */
export const ArrowPush = ({ active }: { active: boolean }) => (
  <span
    className={`inline-flex shrink-0 overflow-hidden text-primary-500
      transition-[max-width] duration-[400ms] ease-swipe
      ${
        active
          ? "max-w-7"
          : "max-w-0 group-hover:max-w-7 group-focus-visible:max-w-7"
      }`}
  >
    <span
      className={`mr-3 inline-flex
        transition-transform duration-[400ms] ease-swipe
        ${
          active
            ? "translate-x-0"
            : "-translate-x-full group-hover:translate-x-0 group-focus-visible:translate-x-0"
        }`}
    >
      <ArrowRight />
    </span>
  </span>
);
