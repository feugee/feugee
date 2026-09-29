import { describe, expect, it } from "vitest";

import { videoSourceValidate, youtubeVideoIdOf } from "./videoSource";

describe("youtubeVideoIdOf", () => {
  it.each([
    ["dQw4w9WgXcQ"],
    ["  dQw4w9WgXcQ  "],
    ["_-abcdefghI"],
  ])("accepts a bare eleven-character ID (%s)", (input: string) => {
    expect(youtubeVideoIdOf(input)).toBe(input.trim());
  });

  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
    ["http://youtube.com/watch?v=dQw4w9WgXcQ&t=30s"],
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ"],
    ["https://music.youtube.com/watch?v=dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ"],
    ["https://www.youtube.com/live/dQw4w9WgXcQ"],
    ["https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
  ])("extracts the ID from %s", (input) => {
    expect(youtubeVideoIdOf(input)).toBe("dQw4w9WgXcQ");
  });

  it.each([
    ["dQw4w9WgXc"], // ten characters
    ["dQw4w9WgXcQQ"], // twelve
    ["not a video"],
    ["https://vimeo.com/12345"],
    ["https://youtube.com/watch"],
    ["https://youtube.com/watch?v=short"],
    ["javascript:alert(1)"],
    ["https://youtu.be/"],
  ])("rejects %s", (input: string) => {
    expect(youtubeVideoIdOf(input)).toBeNull();
  });
});

describe("videoSourceValidate", () => {
  const required = videoSourceValidate(true);
  const optional = videoSourceValidate(false);

  const embedValue = (overrides: Record<string, unknown> = {}) => ({
    source: "embed",
    embed: {
      provider: "youtube",
      url: "https://youtu.be/dQw4w9WgXcQ",
      alt: "An embedded video",
      videoId: "dQw4w9WgXcQ",
      ...overrides,
    },
  });

  it("demands a source when required, passes an empty optional group", () => {
    expect(required(undefined)).not.toBe(true);
    expect(optional(undefined)).toBe(true);
  });

  it("accepts a settled embed", () => {
    expect(required(embedValue())).toBe(true);
    expect(optional(embedValue())).toBe(true);
  });

  it("demands a URL for a required embed but lets an optional one sit empty", () => {
    expect(required(embedValue({ url: "" }))).not.toBe(true);
    expect(optional(embedValue({ url: "" }))).toBe(true);
  });

  it("rejects an unrecognizable URL", () => {
    expect(required(embedValue({ url: "https://vimeo.com/12345" }))).not.toBe(
      true,
    );
  });

  it("demands alt text for an embed, like every uploaded Asset", () => {
    expect(required(embedValue({ alt: " " }))).not.toBe(true);
  });

  it("never allows both sides of the either/or at once", () => {
    expect(required({ ...embedValue(), asset: 7 })).not.toBe(true);
    expect(
      required({ source: "asset", asset: 7, embed: { url: "dQw4w9WgXcQ" } }),
    ).not.toBe(true);
  });

  it("demands an upload on the asset side when required", () => {
    expect(required({ source: "asset", asset: null })).not.toBe(true);
    expect(required({ source: "asset", asset: 7 })).toBe(true);
    expect(optional({ source: "asset", asset: null })).toBe(true);
  });
});
