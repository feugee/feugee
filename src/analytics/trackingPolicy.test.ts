import { describe, expect, it } from "vitest";

import { canLoadGoogleTag } from "./trackingPolicy";

const policy = {
  containerId: "GTM-AB12CD3",
  productionUrl: "https://feugee.com",
  currentUrl: "https://feugee.com/works",
  production: true,
  consent: true,
};

describe("canLoadGoogleTag", () => {
  it("allows consented visitors on the production origin", () => {
    expect(canLoadGoogleTag(policy)).toBe(true);
  });

  it.each([
    ["without a container ID", { containerId: undefined }],
    ["without production mode", { production: false }],
    ["without consent", { consent: false }],
    [
      "on a preview deployment",
      { currentUrl: "https://feugee-git-preview.vercel.app/works" },
    ],
    [
      "on the authenticated Work preview",
      { currentUrl: "https://feugee.com/works/example/preview" },
    ],
    [
      "inside CMS Live Preview",
      { currentUrl: "https://feugee.com/?livePreview=footer" },
    ],
    ["on a non-HTTPS origin", { currentUrl: "http://feugee.com/works" }],
  ])("blocks tracking %s", (_label, overrides) => {
    expect(canLoadGoogleTag({ ...policy, ...overrides })).toBe(false);
  });
});
