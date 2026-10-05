import { describe, expect, it } from "vitest";

import {
  RAIL_LINE_MAX_PX,
  RAIL_LINE_REST_PX,
  railLineWidth,
} from "./railProximity";

describe("railLineWidth", () => {
  it("peaks at the max length on the line itself", () => {
    expect(railLineWidth(0)).toBe(RAIL_LINE_MAX_PX);
  });

  it("rests at the resting length for a pointer far away", () => {
    // The falloff never quite reaches rest — a thousandth of a pixel
    // past it at ten viewports' distance.
    expect(railLineWidth(10_000)).toBeCloseTo(RAIL_LINE_REST_PX, 2);
  });

  it("falls off with distance, each row out a step shorter", () => {
    const near = railLineWidth(48);
    const further = railLineWidth(96);
    const furthest = railLineWidth(144);
    expect(near).toBeLessThan(RAIL_LINE_MAX_PX);
    expect(near).toBeGreaterThan(further);
    expect(further).toBeGreaterThan(furthest);
    expect(furthest).toBeGreaterThan(RAIL_LINE_REST_PX);
  });

  it("swells a neighbor at one row pitch to exactly half the swell", () => {
    // 32px rows + 16px gaps put the next line 48px out; the falloff
    // radius is that same pitch, so half the swell survives there.
    expect(railLineWidth(48)).toBe(
      RAIL_LINE_REST_PX + (RAIL_LINE_MAX_PX - RAIL_LINE_REST_PX) / 2,
    );
  });
});
