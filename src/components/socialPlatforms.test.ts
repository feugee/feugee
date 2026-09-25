import { describe, expect, it } from "vitest";

import type { Footer } from "@/payload-types";

import {
  socialPlatformOptions,
  socialPlatforms,
  toSocialLinks,
} from "./socialPlatforms";

// The coherence contract between the CMS and the render: the Footer global's
// platform select offers socialPlatformOptions and FooterView draws its icons
// from socialPlatforms, so the two must cover exactly the same platforms — a
// Social Link's platform can never be silently unrenderable.
describe("socialPlatforms", () => {
  it("icons every CMS-selectable platform — and no platform the CMS cannot pick", () => {
    expect(Object.keys(socialPlatforms).sort()).toEqual(
      socialPlatformOptions.map((option) => option.value).sort(),
    );
  });

  it("labels each icon with its CMS option label — the aria-label matches the CMS", () => {
    for (const { label, value } of socialPlatformOptions) {
      expect(socialPlatforms[value].label).toBe(label);
    }
  });

  it("offers each platform exactly once, with filled-in labels", () => {
    const values = socialPlatformOptions.map((option) => option.value);
    expect(new Set(values).size).toBe(values.length);

    for (const { label } of socialPlatformOptions) {
      expect(label.trim()).toBe(label);
      expect(label).not.toBe("");
    }
  });
});

describe("toSocialLinks", () => {
  it("resolves each row to its platform's label and icon, with a trimmed URL", () => {
    const [link] = toSocialLinks([
      { id: "a", platform: "behance", url: " https://www.behance.net/feugee " },
    ]);

    expect(link).toMatchObject({
      id: "a",
      url: "https://www.behance.net/feugee",
      label: "Behance",
      Icon: socialPlatforms.behance.Icon,
    });
  });

  it("renders nothing for an unknown platform value — stale data from before the typed select", () => {
    // The double cast stands in for data the CMS types can no longer express.
    const stale = [
      { platform: "myspace", url: "https://myspace.com/feugee" },
    ] as unknown as Footer["socialLinks"];

    expect(toSocialLinks(stale)).toEqual([]);
  });

  it("drops rows whose URL is blank", () => {
    expect(
      toSocialLinks([{ platform: "contra", url: "   " }]),
    ).toEqual([]);
  });

  it("falls back to the URL as the React key when the row has no id", () => {
    const [link] = toSocialLinks([
      { platform: "x", url: "https://x.com/feugeestudio" },
    ]);

    expect(link?.id).toBe("https://x.com/feugeestudio");
  });

  it("tolerates absent social links", () => {
    expect(toSocialLinks(null)).toEqual([]);
    expect(toSocialLinks(undefined)).toEqual([]);
  });
});
