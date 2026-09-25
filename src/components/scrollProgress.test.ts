import { describe, expect, it } from "vitest";

import { scrollProgressClipInset } from "./scrollProgress";

describe("scrollProgressClipInset", () => {
  it("clips the whole bar from the right before any scroll", () => {
    expect(scrollProgressClipInset(0)).toBe("inset(0 100% 0 0)");
  });

  it("reveals the whole bar at full progress", () => {
    expect(scrollProgressClipInset(1)).toBe("inset(0 0% 0 0)");
  });

  it("reveals half the bar at half progress", () => {
    expect(scrollProgressClipInset(0.5)).toBe("inset(0 50% 0 0)");
  });

  it("clamps overscroll below zero to a fully hidden bar", () => {
    expect(scrollProgressClipInset(-0.25)).toBe("inset(0 100% 0 0)");
  });

  it("clamps progress past one to a fully revealed bar", () => {
    expect(scrollProgressClipInset(1.75)).toBe("inset(0 0% 0 0)");
  });

  it("rounds float noise to two decimals", () => {
    expect(scrollProgressClipInset(1 / 3)).toBe("inset(0 66.67% 0 0)");
    expect(scrollProgressClipInset(0.2000000001)).toBe("inset(0 80% 0 0)");
  });
});
