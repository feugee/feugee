import { describe, expect, it } from "vitest";

import {
  DEFAULT_CLIENTS_HEADING,
  DEFAULT_SELECTED_WORKS_HEADING,
  landingHeadingOf,
} from "./landingHeadings";

describe("Landing Page heading fallbacks", () => {
  it('defaults the Selected Works heading to "Selected Works"', () => {
    expect(DEFAULT_SELECTED_WORKS_HEADING).toBe("Selected Works");
    expect(landingHeadingOf(null, DEFAULT_SELECTED_WORKS_HEADING)).toBe("Selected Works");
    expect(landingHeadingOf(undefined, DEFAULT_SELECTED_WORKS_HEADING)).toBe(
      "Selected Works",
    );
  });

  it('defaults the clients heading to "Clients Ideas We\'ve Visualized"', () => {
    expect(DEFAULT_CLIENTS_HEADING).toBe("Clients Ideas We've Visualized");
    expect(landingHeadingOf("", DEFAULT_CLIENTS_HEADING)).toBe(
      "Clients Ideas We've Visualized",
    );
    expect(landingHeadingOf("   ", DEFAULT_CLIENTS_HEADING)).toBe(
      "Clients Ideas We've Visualized",
    );
  });

  it("keeps a CMS-edited heading, trimmed", () => {
    expect(landingHeadingOf("  Featured Films  ", DEFAULT_SELECTED_WORKS_HEADING)).toBe(
      "Featured Films",
    );
    expect(landingHeadingOf("Brands We've Moved", DEFAULT_CLIENTS_HEADING)).toBe(
      "Brands We've Moved",
    );
  });
});
