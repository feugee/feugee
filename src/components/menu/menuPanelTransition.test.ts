import { describe, expect, it } from "vitest";

import {
  menuPanelTransition,
  menuVeilTransition,
} from "./menuPanelTransition";

describe("menuPanelTransition", () => {
  it("slides the panel in on the site's swipe curve", () => {
    const className = menuPanelTransition(true);

    expect(className).toContain("translate-x-0");
    expect(className).toContain("visible");
    expect(className).toContain("duration-[400ms]");
    expect(className).toContain("ease-swipe");
  });

  it("parks the panel off-screen when closed, exiting fast", () => {
    const className = menuPanelTransition(false);

    expect(className).toContain("translate-x-full");
    expect(className).toContain("invisible");
    expect(className).toContain("duration-[200ms]");
  });

  it("rides only translate and visibility, and skips motion under reduced motion", () => {
    for (const open of [true, false]) {
      const className = menuPanelTransition(open);

      expect(className).toContain("transition-[translate,visibility]");
      expect(className).toContain("motion-reduce:transition-none");
    }
  });
});

describe("menuVeilTransition", () => {
  it("fades the veil in beside the panel's own ride", () => {
    const className = menuVeilTransition(true);

    expect(className).toContain("opacity-100");
    expect(className).toContain("visible");
    expect(className).toContain("duration-[400ms]");
  });

  it("fades the veil out fast and releases input when closed", () => {
    const className = menuVeilTransition(false);

    expect(className).toContain("opacity-0");
    expect(className).toContain("invisible");
    expect(className).toContain("duration-[200ms]");
  });

  it("rides only opacity and visibility, and skips motion under reduced motion", () => {
    for (const open of [true, false]) {
      const className = menuVeilTransition(open);

      expect(className).toContain("transition-[opacity,visibility]");
      expect(className).toContain("motion-reduce:transition-none");
    }
  });
});
