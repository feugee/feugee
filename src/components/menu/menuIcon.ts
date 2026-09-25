/**
 * The Menu control's icon lines: closed, the second line rides at 2/3 the
 * first's length; open, both go equal length and travel the 5px between
 * their resting centers to cross as a centered X. Both lines share one
 * transition (~300ms on the site's swipe curve) so the morph stays in
 * lockstep; reduced motion drops to a plain recolor and snaps. Literal
 * strings throughout — Tailwind only generates the classes it can read in
 * source.
 */
const LINE_TRANSITION =
  "transition-[width,translate,rotate,background-color] duration-300 ease-swipe motion-reduce:transition-[background-color]";

export const menuIconLine = (open: boolean, first: boolean): string =>
  first
    ? `h-[2px] w-full bg-current ${LINE_TRANSITION} ${
        open ? "translate-y-[5px] rotate-45" : ""
      }`
    : `h-[2px] bg-current ${LINE_TRANSITION} ${
        open ? "w-full -translate-y-[5px] -rotate-45" : "w-2/3"
      }`;
