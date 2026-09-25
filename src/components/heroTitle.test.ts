import { describe, expect, it } from "vitest";

import {
  accessibleHeroTitle,
  DEFAULT_HERO_LEAD_IN,
  heroLeadInOf,
  normalizeRotatingWords,
} from "./heroTitle";

describe("normalizeRotatingWords", () => {
  it("keeps filled words and trims surrounding whitespace", () => {
    expect(
      normalizeRotatingWords([{ id: "1", word: " Motion " }, { id: "2", word: "Design" }]),
    ).toEqual(["Motion", "Design"]);
  });

  it("drops wordless rows — a mid-edit Live Preview state", () => {
    expect(
      normalizeRotatingWords([{ id: "1", word: "Motion" }, { id: "2", word: null }]),
    ).toEqual(["Motion"]);
  });

  it("drops rows that are blank after trimming", () => {
    expect(
      normalizeRotatingWords([{ id: "1", word: "   " }, { id: "2", word: "" }]),
    ).toEqual([]);
  });

  it("returns an empty list for null and undefined", () => {
    expect(normalizeRotatingWords(null)).toEqual([]);
    expect(normalizeRotatingWords(undefined)).toEqual([]);
  });
});

describe("heroLeadInOf", () => {
  it("defaults the lead-in word to \"Into\"", () => {
    expect(DEFAULT_HERO_LEAD_IN).toBe("Into");
    expect(heroLeadInOf(null)).toBe("Into");
    expect(heroLeadInOf(undefined)).toBe("Into");
  });

  it("keeps a filled lead-in word and trims it", () => {
    expect(heroLeadInOf("Beyond")).toBe("Beyond");
    expect(heroLeadInOf("  Through  ")).toBe("Through");
  });

  it("falls back to the default when blank after trimming", () => {
    expect(heroLeadInOf("")).toBe("Into");
    expect(heroLeadInOf("   ")).toBe("Into");
  });
});

describe("accessibleHeroTitle", () => {
  it("joins the title, the lead-in word, and every word", () => {
    expect(
      accessibleHeroTitle("We're Feugee", ["Motion", "Design", "Experience"], "Into"),
    ).toBe("We're Feugee Into Motion, Design, Experience");
  });

  it("carries a CMS-edited lead-in word", () => {
    expect(accessibleHeroTitle("We're Feugee", ["Motion"], "Beyond")).toBe(
      "We're Feugee Beyond Motion",
    );
  });

  it("falls back to the bare title when there are no words", () => {
    expect(accessibleHeroTitle("We're Feugee", [], "Into")).toBe("We're Feugee");
  });
});
