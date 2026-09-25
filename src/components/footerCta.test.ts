import { describe, expect, it } from "vitest";

import { hasFooterCtaContent, toFooterCta } from "./footerCta";

describe("toFooterCta", () => {
  it("keeps filled fields and trims surrounding whitespace", () => {
    expect(
      toFooterCta({
        eyebrow: " Free 20-min intro call ",
        headline: "Tell us what you're building",
        body: "Tell us about your goals.",
        actionLabel: " Work with us ",
        actionUrl: " /contact ",
        secondaryActionLabel: " See our works ",
        secondaryActionUrl: " /works ",
      }),
    ).toEqual({
      eyebrow: "Free 20-min intro call",
      headline: "Tell us what you're building",
      body: "Tell us about your goals.",
      actionLabel: "Work with us",
      actionUrl: "/contact",
      secondaryActionLabel: "See our works",
      secondaryActionUrl: "/works",
    });
  });

  it("reads blank fields as null — a mid-edit Live Preview state", () => {
    expect(toFooterCta({ headline: "   ", body: null })).toEqual({
      eyebrow: null,
      headline: null,
      body: null,
      actionLabel: null,
      actionUrl: null,
      secondaryActionLabel: null,
      secondaryActionUrl: null,
    });
  });

  it("returns all-null content for null and undefined", () => {
    const absent = {
      eyebrow: null,
      headline: null,
      body: null,
      actionLabel: null,
      actionUrl: null,
      secondaryActionLabel: null,
      secondaryActionUrl: null,
    };
    expect(toFooterCta(null)).toEqual(absent);
    expect(toFooterCta(undefined)).toEqual(absent);
  });

  it("offers the secondary action only when its label is filled", () => {
    // A label-less secondary button does not render, so its URL — filled or
    // not — resolves to nothing the markup can use.
    expect(
      toFooterCta({
        secondaryActionLabel: "   ",
        secondaryActionUrl: "/works",
      }),
    ).toEqual({
      eyebrow: null,
      headline: null,
      body: null,
      actionLabel: null,
      actionUrl: null,
      secondaryActionLabel: null,
      secondaryActionUrl: "/works",
    });
  });
});

describe("hasFooterCtaContent", () => {
  it("shows the section when any visible field is filled", () => {
    expect(hasFooterCtaContent(toFooterCta({ eyebrow: "Hi" }))).toBe(true);
    expect(hasFooterCtaContent(toFooterCta({ actionLabel: "Work with us" }))).toBe(true);
    expect(hasFooterCtaContent(toFooterCta({ secondaryActionLabel: "See our works" }))).toBe(true);
  });

  it("hides the section when only a URL is set — a URL only completes its button", () => {
    expect(hasFooterCtaContent(toFooterCta({ actionUrl: "/contact" }))).toBe(false);
    expect(hasFooterCtaContent(toFooterCta({ secondaryActionUrl: "/works" }))).toBe(false);
  });

  it("hides the section for absent content", () => {
    expect(hasFooterCtaContent(toFooterCta(undefined))).toBe(false);
  });
});
