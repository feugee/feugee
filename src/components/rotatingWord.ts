/**
 * The Rotating Word's softblur crossfade, as a timing contract: every word
 * holds WORD_HOLD_MS, then the outgoing and incoming words trade places over
 * WORD_TRANSITION_MS — both fading while blurring to WORD_BLUR_PX on the
 * shared swipe easing. The cycle advances once per hold-plus-transition, so
 * the timer and the CSS transition never overlap mid-flight.
 */

export const WORD_HOLD_MS = 1500;
export const WORD_TRANSITION_MS = 500;
export const WORD_BLUR_PX = 8;

// One full word turn: the hold, then the crossfade it ends with.
export const WORD_CYCLE_MS = WORD_HOLD_MS + WORD_TRANSITION_MS;

export const nextWordIndex = (current: number, count: number): number =>
  count <= 1 ? 0 : ((current % count) + 1) % count;
