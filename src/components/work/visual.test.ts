import { describe, expect, it } from "vitest";

import type { Asset, Work } from "@/payload-types";

import { sizedUrlOf, videoSourceVisualOf, workThumbnailOf } from "./visual";

const ladder = (prefix: string, ratio = 400 / 640) => ({
  thumbnail: {
    url: `/api/assets/file/${prefix}-640x${Math.round(640 * ratio)}.webp`,
    width: 640,
    height: Math.round(640 * ratio),
    mimeType: "image/webp",
    filesize: 40_000,
    filename: `${prefix}-640x400.webp`,
  },
  tablet: {
    url: `/api/assets/file/${prefix}-1024x${Math.round(1024 * ratio)}.webp`,
    width: 1024,
    height: Math.round(1024 * ratio),
    mimeType: "image/webp",
    filesize: 90_000,
    filename: `${prefix}-1024x640.webp`,
  },
  desktop: {
    url: `/api/assets/file/${prefix}-1600x${Math.round(1600 * ratio)}.webp`,
    width: 1600,
    height: Math.round(1600 * ratio),
    mimeType: "image/webp",
    filesize: 180_000,
    filename: `${prefix}-1600x1000.webp`,
  },
  wide: {
    url: `/api/assets/file/${prefix}-2400x${Math.round(2400 * ratio)}.webp`,
    width: 2400,
    height: Math.round(2400 * ratio),
    mimeType: "image/webp",
    filesize: 340_000,
    filename: `${prefix}-2400x1500.webp`,
  },
});

const sizedAsset = (overrides: Partial<Asset> = {}): Asset =>
  ({
    id: 1,
    url: "/api/assets/file/original.png",
    alt: "An image",
    mimeType: "image/png",
    width: 3200,
    height: 2000,
    sizes: ladder("original"),
    ...overrides,
  }) as unknown as Asset;

const work = (thumbnail: Work["thumbnail"]): Work =>
  ({
    id: 10,
    title: "Fest for Music",
    _status: "published",
    thumbnail,
  }) as unknown as Work;

/** The Video Source group set to its upload side. */
function upload(asset: Asset | number | null): Work["thumbnail"] {
  return { source: "asset", asset };
}

describe("sizedUrlOf", () => {
  it("returns the requested size's variant when generated", () => {
    expect(sizedUrlOf(sizedAsset(), "tablet")).toBe(
      "/api/assets/file/original-1024x640.webp",
    );
  });

  it("falls back to the widest available variant when the requested size was skipped", () => {
    // An original narrower than 1600px gets no desktop/wide variants — the
    // widest generated size is the closest stand-in.
    const asset = sizedAsset({
      width: 1200,
      height: 750,
      sizes: {
        thumbnail: sizedAsset().sizes!.thumbnail,
        tablet: sizedAsset().sizes!.tablet,
        desktop: undefined,
        wide: undefined,
      },
    });

    expect(sizedUrlOf(asset, "wide")).toBe(
      "/api/assets/file/original-1024x640.webp",
    );
  });

  it("falls back to the original url when the asset has no variants", () => {
    // SVGs and not-yet-regenerated assets: never worse than the status quo.
    expect(sizedUrlOf(sizedAsset({ sizes: undefined }), "wide")).toBe(
      "/api/assets/file/original.png",
    );
  });

  it("falls back to the original url when every variant entry is empty", () => {
    expect(
      sizedUrlOf(
        sizedAsset({
          sizes: {
          thumbnail: undefined,
          tablet: undefined,
          desktop: undefined,
          wide: undefined,
        },
        }),
        "tablet",
      ),
    ).toBe("/api/assets/file/original.png");
  });

  it("treats a variant with a null url as missing", () => {
    const asset = sizedAsset();
    asset.sizes!.tablet = { url: null, width: 1024, height: 640 };

    expect(sizedUrlOf(asset, "tablet")).toBe(
      "/api/assets/file/original-1600x1000.webp",
    );
  });
});

describe("workThumbnailOf with a size", () => {
  it("serves the size's variant but keeps the original dimensions for layout", () => {
    const visual = workThumbnailOf(work(upload(sizedAsset())), "desktop");

    expect(visual).toMatchObject({
      kind: "image",
      url: "/api/assets/file/original-1600x1000.webp",
      width: 3200,
      height: 2000,
    });
  });

  it("sizes a video's poster url but keeps the poster's dimensions", () => {
    const video = sizedAsset({
      id: 2,
      url: "/api/assets/file/video.mp4",
      alt: "A video",
      mimeType: "video/mp4",
      width: null,
      height: null,
      sizes: undefined,
      poster: sizedAsset({
        id: 3,
        url: "/api/assets/file/poster.png",
        width: 1920,
        height: 1080,
        sizes: ladder("poster", 1080 / 1920),
      }),
    }) as unknown as Asset;

    const visual = workThumbnailOf(work(upload(video)), "wide");

    expect(visual).toMatchObject({
      kind: "video",
      source: { type: "file", url: "/api/assets/file/video.mp4" },
      posterUrl: "/api/assets/file/poster-2400x1350.webp",
      width: 1920,
      height: 1080,
    });
  });
});

describe("videoSourceVisualOf (embed branch)", () => {
  it("carries the video ID, sized poster, and poster dimensions", () => {
    const visual = videoSourceVisualOf(
      {
        source: "embed",
        embed: {
          provider: "youtube",
          url: "https://youtu.be/dQw4w9WgXcQ",
          alt: "An embedded video",
          videoId: "dQw4w9WgXcQ",
          poster: sizedAsset({
            id: 4,
            url: "/api/assets/file/youtube.jpg",
            width: 1280,
            height: 720,
            sizes: ladder("youtube", 720 / 1280),
          }),
        },
      },
      "tablet",
    );

    expect(visual).toEqual({
      kind: "video",
      source: { type: "youtube", videoId: "dQw4w9WgXcQ" },
      posterUrl: "/api/assets/file/youtube-1024x576.webp",
      width: 1280,
      height: 720,
      alt: "An embedded video",
    });
  });

  it("falls back to the 16:9 aspect slot and no poster without one", () => {
    const visual = videoSourceVisualOf({
      source: "embed",
      embed: {
        provider: "youtube",
        url: "https://youtu.be/dQw4w9WgXcQ",
        alt: "An embedded video",
        videoId: "dQw4w9WgXcQ",
        poster: 99,
      },
    });

    expect(visual).toEqual({
      kind: "video",
      source: { type: "youtube", videoId: "dQw4w9WgXcQ" },
      posterUrl: null,
      width: 16,
      height: 9,
      alt: "An embedded video",
    });
  });

  it("derives a placeholder alt when the editor left it blank", () => {
    const visual = videoSourceVisualOf({
      source: "embed",
      embed: {
        provider: "youtube",
        url: "https://youtu.be/dQw4w9WgXcQ",
        alt: "  ",
        videoId: "dQw4w9WgXcQ",
      },
    });

    expect(visual?.alt).toBe("YouTube video dQw4w9WgXcQ");
  });

  it("drops an embed without its derived video ID", () => {
    expect(
      videoSourceVisualOf({
        source: "embed",
        embed: {
          provider: "youtube",
          url: "https://youtu.be/dQw4w9WgXcQ",
          alt: "An embedded video",
          videoId: null,
        },
      }),
    ).toBeNull();
    // A group still mid-edit — no embed object at all.
    expect(videoSourceVisualOf({ source: "embed" })).toBeNull();
  });
});
