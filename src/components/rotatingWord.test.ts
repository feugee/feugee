import { describe, expect, it } from "vitest";

import {
  nextWordIndex,
  WORD_BLUR_PX,
  WORD_CYCLE_MS,
  WORD_HOLD_MS,
  WORD_TRANSITION_MS,
} from "./rotatingWord";

describe("softblur timing contract", () => {
  it("holds each word for 1.5 seconds", () => {
    expect(WORD_HOLD_MS).toBe(1500);
  });

  it("crossfades over 0.5 seconds", () => {
    expect(WORD_TRANSITION_MS).toBe(500);
  });

  it("blurs to roughly 8px", () => {
    expect(WORD_BLUR_PX).toBe(8);
  });

  it("advances the cycle only after the hold plus the crossfade", () => {
    expect(WORD_CYCLE_MS).toBe(WORD_HOLD_MS + WORD_TRANSITION_MS);
    expect(WORD_CYCLE_MS).toBe(2000);
  });
});

describe("nextWordIndex", () => {
  it("steps forward through the list", () => {
    expect(nextWordIndex(0, 3)).toBe(1);
    expect(nextWordIndex(1, 3)).toBe(2);
  });

  it("wraps from the last word back to the first", () => {
    expect(nextWordIndex(2, 3)).toBe(0);
  });

  it("pins a single word at index 0", () => {
    expect(nextWordIndex(0, 1)).toBe(0);
  });

  it("treats an empty list the same as a single word", () => {
    expect(nextWordIndex(0, 0)).toBe(0);
  });

  it("settles out-of-range currents back into the list", () => {
    expect(nextWordIndex(5, 3)).toBe(0);
    expect(nextWordIndex(-1, 3)).toBe(0);
  });
});
