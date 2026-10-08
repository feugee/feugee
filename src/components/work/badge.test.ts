import { describe, expect, it } from "vitest";

import type { Asset, Badge, Work } from "@/payload-types";

import { badgeOf } from "./badge";

const iconAsset = (overrides: Partial<Asset> = {}): Asset =>
  ({
    id: 5,
    url: "/assets/badge.svg",
    alt: "A badge icon",
    mimeType: "image/svg+xml",
    width: null,
    height: null,
    ...overrides,
  }) as unknown as Asset;

const badge = (overrides: Partial<Badge> = {}): Badge =>
  ({
    id: 7,
    name: "Award Winner",
    color: "#F2631C",
    icon: iconAsset(),
    ...overrides,
  }) as unknown as Badge;

describe("badgeOf", () => {
  it("resolves a whole Badge to its render shape", () => {
    expect(badgeOf(badge() as unknown as Work["badge"])).toEqual({
      name: "Award Winner",
      color: "#F2631C",
      iconUrl: "/assets/badge.svg",
    });
  });

  it("rejects a bare relationship id", () => {
    expect(badgeOf(7 as unknown as Work["badge"])).toBeNull();
  });

  it("rejects an empty field", () => {
    expect(badgeOf(null)).toBeNull();
    expect(badgeOf(undefined)).toBeNull();
  });

  it("rejects a Badge whose icon is a bare id", () => {
    expect(
      badgeOf(badge({ icon: 5 }) as unknown as Work["badge"]),
    ).toBeNull();
  });

  it("rejects a Badge whose icon has no URL", () => {
    expect(
      badgeOf(
        badge({ icon: iconAsset({ url: null }) }) as unknown as Work["badge"],
      ),
    ).toBeNull();
  });

  it("rejects a Badge missing its name or color", () => {
    expect(
      badgeOf(badge({ name: undefined }) as unknown as Work["badge"]),
    ).toBeNull();
    expect(
      badgeOf(badge({ color: undefined }) as unknown as Work["badge"]),
    ).toBeNull();
  });
});
