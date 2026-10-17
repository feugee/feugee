import { describe, expect, it } from "vitest";

import { menuIconLine } from "./menuIcon";

describe("menuIconLine", () => {
  it("rests the first line at full length and the second at 2/3", () => {
    expect(menuIconLine(false, true)).toContain("w-full");
    expect(menuIconLine(false, true)).not.toContain("translate-y");

    expect(menuIconLine(false, false)).toContain("w-2/3");
    expect(menuIconLine(false, false)).not.toContain("w-full");
    expect(menuIconLine(false, false)).not.toContain("rotate-");
  });

  it("grows both lines to equal length and crosses them at the center when open", () => {
    expect(menuIconLine(true, true)).toContain("rotate-45");
    expect(menuIconLine(true, true)).toContain("lg:translate-y-[5px]");
    expect(menuIconLine(true, false)).toContain("w-full");
    expect(menuIconLine(true, false)).toContain("-rotate-45");
    expect(menuIconLine(true, false)).toContain("lg:-translate-y-[5px]");
  });

  it("rides the site's swipe curve at ~300ms", () => {
    for (const open of [true, false]) {
      for (const first of [true, false]) {
        const className = menuIconLine(open, first);

        expect(className).toContain("duration-300");
        expect(className).toContain("ease-swipe");
      }
    }
  });
});
