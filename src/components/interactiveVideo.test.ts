import { describe, expect, it } from "vitest";

import { formatTime, seekRatioOf } from "@/components/interactiveVideo";

describe("formatTime", () => {
  it("renders minutes and seconds", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(5)).toBe("0:05");
    expect(formatTime(59)).toBe("0:59");
    expect(formatTime(60)).toBe("1:00");
    expect(formatTime(83.7)).toBe("1:23");
  });

  it("turns hours into h:mm:ss", () => {
    expect(formatTime(3600)).toBe("1:00:00");
    expect(formatTime(3723)).toBe("1:02:03");
  });

  it("survives junk the player might report", () => {
    expect(formatTime(-3)).toBe("0:00");
    expect(formatTime(Number.NaN)).toBe("0:00");
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe("0:00");
  });
});

describe("seekRatioOf", () => {
  it("maps a pointer position to a 0..1 fraction of the track", () => {
    expect(seekRatioOf({ left: 100, width: 200 }, 100)).toBe(0);
    expect(seekRatioOf({ left: 100, width: 200 }, 200)).toBe(0.5);
    expect(seekRatioOf({ left: 100, width: 200 }, 300)).toBe(1);
  });

  it("clamps drags past either edge", () => {
    expect(seekRatioOf({ left: 100, width: 200 }, 50)).toBe(0);
    expect(seekRatioOf({ left: 100, width: 200 }, 500)).toBe(1);
  });

  it("returns 0 for a zero-width track", () => {
    expect(seekRatioOf({ left: 0, width: 0 }, 120)).toBe(0);
  });
});
