import type { ReactNode } from "react";

/**
 * Swipe Text (CONTEXT.md): a control's label exchanging two clipped copies on
 * hover — the resting copy swipes up out of view while an identical
 * primary-500 copy swipes up from below into its place. The interactive
 * element that wraps this owns the state, so it must carry the `group`
 * class (forgetting it means a silent no-op hover); the swap rides
 * group-hover and group-focus-visible, 400ms on the site's swipe curve.
 * Typography is inherited from the wrapping element; the primary-500 copy
 * overrides the inherited color itself.
 */
export const SwipeText = ({ children }: { children: ReactNode }) => (
  <span className="relative inline-block overflow-hidden">
    <span
      className={`block transition-transform duration-[400ms] ease-swipe
        group-hover:-translate-y-full group-focus-visible:-translate-y-full`}
    >
      {children}
    </span>
    <span
      aria-hidden="true"
      className={`absolute inset-0 block translate-y-full text-primary-500
        transition-transform duration-[400ms] ease-swipe
        group-hover:translate-y-0 group-focus-visible:translate-y-0`}
    >
      {children}
    </span>
  </span>
);
