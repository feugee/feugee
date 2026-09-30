/**
 * The Menu's surfaces' ride — the panel sliding full-height from the
 * viewport's right edge, and the dimmed veil stilling the page behind it.
 * Opening matches the items' 400ms swipe; closing exits in a fifth of a
 * second because dismissal shouldn't make the visitor wait (the Navbar's
 * bar keeps its own frost-length settle home — see globals.css). Visibility
 * rides along, so the closed surfaces release input only after their exit
 * finishes. Literal strings throughout — Tailwind only generates the
 * classes it can read in source.
 */
export const menuPanelTransition = (open: boolean): string =>
  `transition-[translate,visibility] ease-swipe motion-reduce:transition-none ${
    open
      ? "duration-[400ms] translate-x-0 visible"
      : "duration-[200ms] translate-x-full invisible"
  }`;

export const menuVeilTransition = (open: boolean): string =>
  `transition-[opacity,visibility] ease-swipe motion-reduce:transition-none ${
    open
      ? "duration-[400ms] opacity-100 visible"
      : "duration-[200ms] opacity-0 invisible"
  }`;
