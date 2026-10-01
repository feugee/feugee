import { describe, expect, it } from "vitest";

import { MENU_ITEM_STAGGER_MS, menuItemTransition } from "./menuItemTransition";

describe("menuItemTransition", () => {
  it("swipes the first open item in with no delay", () => {
    const { className, transitionDelay } = menuItemTransition(true, 0);

    expect(className).toContain("translate-y-0");
    expect(className).toContain("opacity-100");
    expect(className).toContain("duration-[400ms]");
    expect(transitionDelay).toBe("0ms");
  });

  it("staggers each later open item by the step", () => {
    expect(menuItemTransition(true, 1).transitionDelay).toBe(
      `${MENU_ITEM_STAGGER_MS}ms`,
    );
    expect(menuItemTransition(true, 3).transitionDelay).toBe(
      `${3 * MENU_ITEM_STAGGER_MS}ms`,
    );
  });

  it("drops every closed item out together: full offset, fast, no delay", () => {
    const { className, transitionDelay } = menuItemTransition(false, 2);

    expect(className).toContain("translate-y-full");
    expect(className).toContain("opacity-0");
    expect(className).toContain("duration-[200ms]");
    expect(transitionDelay).toBe("0ms");
  });

  it("rides the site's swipe curve in both directions", () => {
    for (const open of [true, false]) {
      const { className } = menuItemTransition(open, 0);

      expect(className).toContain("ease-swipe");
    }
  });
});
