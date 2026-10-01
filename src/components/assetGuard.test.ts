import { describe, expect, it } from "vitest";

import { ASSET_GUARD_SELECTOR, targetsRenderedAsset } from "./assetGuard";

/* The decision duck-types its target — node tests fake the one method it
   reads, no DOM needed. */
const targetWhoseClosest = (match: Element | null) =>
  ({
    closest: (selector: string) =>
      selector === ASSET_GUARD_SELECTOR ? match : null,
  }) as unknown as Element;

describe("targetsRenderedAsset", () => {
  it("claims an event that landed on an image or video", () => {
    expect(targetsRenderedAsset(targetWhoseClosest({} as Element))).toBe(true);
  });

  it("leaves events on any other surface alone", () => {
    expect(targetsRenderedAsset(targetWhoseClosest(null))).toBe(false);
  });

  it("ignores a missing target", () => {
    expect(targetsRenderedAsset(null)).toBe(false);
    expect(targetsRenderedAsset(undefined)).toBe(false);
  });

  it("ignores a target that cannot answer a selector", () => {
    expect(targetsRenderedAsset({})).toBe(false);
  });
});
