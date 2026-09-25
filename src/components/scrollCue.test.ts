import { describe, expect, it } from "vitest";

import { resolveScrollCue } from "./scrollCue";

describe("resolveScrollCue", () => {
  it("navigates when both label and URL are filled", () => {
    expect(resolveScrollCue({ label: "See the showreel", url: "/works" })).toEqual({
      kind: "link",
      label: "See the showreel",
      url: "/works",
    });
  });

  it("smooth-scrolls when the label has no URL", () => {
    expect(resolveScrollCue({ label: "Scroll to explore", url: null })).toEqual({
      kind: "scroll",
      label: "Scroll to explore",
    });
    expect(resolveScrollCue({ label: "Scroll to explore" })).toEqual({
      kind: "scroll",
      label: "Scroll to explore",
    });
  });

  it("does not render without a label, whatever the URL says", () => {
    expect(resolveScrollCue({ label: null, url: "/works" })).toEqual({ kind: "hidden" });
    expect(resolveScrollCue({ url: "/works" })).toEqual({ kind: "hidden" });
    expect(resolveScrollCue(null)).toEqual({ kind: "hidden" });
    expect(resolveScrollCue(undefined)).toEqual({ kind: "hidden" });
  });

  it("trims the label and the URL before deciding", () => {
    expect(resolveScrollCue({ label: "  Scroll to explore  ", url: "   " })).toEqual({
      kind: "scroll",
      label: "Scroll to explore",
    });
    expect(resolveScrollCue({ label: "Showreel", url: "  /works  " })).toEqual({
      kind: "link",
      label: "Showreel",
      url: "/works",
    });
    expect(resolveScrollCue({ label: "   ", url: "/works" })).toEqual({ kind: "hidden" });
  });
});
