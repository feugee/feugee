/**
 * The Scroll Progress Bar's reveal (CONTEXT.md): the gradient layer stays
 * full-width and unscaled, and scroll progress clips it from the right — so
 * the primary-to-secondary gradient holds its screen position while the bar
 * fills, instead of being squeezed out of a scaling element.
 */
export const scrollProgressClipInset = (progress: number): string => {
  // Clamped before mapping: overscroll (rubber-banding, a Lenis glide past
  // the end) must not over- or under-reveal the bar.
  const clamped = Math.min(Math.max(progress, 0), 1);
  const hiddenPct = Math.round((1 - clamped) * 10000) / 100;
  return `inset(0 ${hiddenPct}% 0 0)`;
};
