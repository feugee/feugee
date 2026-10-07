import { describe, expect, it } from "vitest";

import type { Asset, Work } from "@/payload-types";

import { toCardWork, clientLogoAttrOf } from "./cardWork";
import { VIDEO_ASPECT_FALLBACK } from "./visual";

const imageAsset = (overrides: Partial<Asset> = {}): Asset =>
  ({
    id: 1,
    url: "/assets/img.png",
    alt: "An image",
    mimeType: "image/png",
    width: 1600,
    height: 900,
    ...overrides,
  }) as unknown as Asset;

const posterAsset = imageAsset({
  id: 3,
  url: "/assets/poster.png",
  width: 640,
  height: 360,
});

const videoAsset = (overrides: Partial<Asset> = {}): Asset =>
  ({
    id: 2,
    url: "/assets/vid.mp4",
    alt: "A video",
    mimeType: "video/mp4",
    width: null,
    height: null,
    poster: posterAsset,
    ...overrides,
  }) as unknown as Asset;

const work = (overrides: Partial<Work> = {}): Work =>
  ({
    id: 10,
    slug: "fest-for-music",
    title: "Fest for Music",
    _status: "published",
    thumbnail: upload(imageAsset()),
    ...overrides,
  }) as unknown as Work;

/** The Video Source group set to its upload side. */
function upload(asset: Asset | number | null): Work["thumbnail"] {
  return { source: "asset", asset };
}

/** The Video Source group set to its embed side. */
function embed(
  overrides: Partial<NonNullable<Work["thumbnail"]>["embed"]> = {},
): Work["thumbnail"] {
  return {
    source: "embed",
    embed: {
      provider: "youtube",
      url: "https://youtu.be/dQw4w9WgXcQ",
      alt: "An embedded video",
      videoId: "dQw4w9WgXcQ",
      ...overrides,
    },
  };
}

describe("toCardWork", () => {
  it("drops a shallow-populated relationship (bare number)", () => {
    expect(toCardWork(42)).toBeNull();
  });

  it("drops null and undefined", () => {
    expect(toCardWork(null)).toBeNull();
    expect(toCardWork(undefined)).toBeNull();
  });

  it("drops an unpublished Work even with a usable Thumbnail", () => {
    expect(toCardWork(work({ _status: "draft" }))).toBeNull();
  });

  it("drops a Work whose Thumbnail's upload is only shallow-populated", () => {
    expect(toCardWork(work({ thumbnail: upload(7) }))).toBeNull();
  });

  it("drops a Work with no Thumbnail at all", () => {
    expect(toCardWork(work({ thumbnail: undefined }))).toBeNull();
  });

  it("maps a published image-thumbnail Work to the card core", () => {
    expect(toCardWork(work())).toEqual({
      id: 10,
      slug: "fest-for-music",
      title: "Fest for Music",
      visual: {
        kind: "image",
        url: "/assets/img.png",
        width: 1600,
        height: 900,
        alt: "An image",
      },
      clientLogo: null,
    });
  });

  it("carries the Work's Client Logo for the Cursor", () => {
    const card = toCardWork(
      work({
        clientLogo: imageAsset({
          id: 6,
          url: "/assets/client.svg",
          mimeType: "image/svg+xml",
          width: 240,
          height: 80,
        }),
      }),
    );

    expect(card?.clientLogo).toEqual({
      url: "/assets/client.svg",
      width: 240,
      height: 80,
    });
  });

  it("falls back to 1×1 for a Client Logo Payload could not measure (SVG)", () => {
    const card = toCardWork(
      work({
        clientLogo: imageAsset({
          id: 6,
          url: "/assets/client.svg",
          mimeType: "image/svg+xml",
          width: null,
          height: null,
        }),
      }),
    );

    expect(card?.clientLogo).toEqual({
      url: "/assets/client.svg",
      width: 1,
      height: 1,
    });
  });

  it("maps a shallow-populated Client Logo to null", () => {
    expect(toCardWork(work({ clientLogo: 9 }))?.clientLogo).toBeNull();
  });

  it("maps a Client Logo without a URL to null", () => {
    expect(
      toCardWork(work({ clientLogo: imageAsset({ id: 6, url: "" }) }))
        ?.clientLogo,
    ).toBeNull();
  });

  it("maps a missing Client Logo to null", () => {
    expect(toCardWork(work({ clientLogo: undefined }))?.clientLogo).toBeNull();
  });

  it("builds the data-cursor-logo payload from the Client Logo", () => {
    expect(
      clientLogoAttrOf({ url: "/assets/client.svg", width: 240, height: 80 }),
    ).toBe("/assets/client.svg 240 80");
    expect(clientLogoAttrOf(null)).toBeUndefined();
  });

  it("falls back to 1×1 for an image Thumbnail Payload could not measure", () => {
    const card = toCardWork(
      work({ thumbnail: upload(imageAsset({ width: null, height: null })) }),
    );

    expect(card?.visual).toMatchObject({ kind: "image", width: 1, height: 1 });
  });

  it("carries the poster's dimensions for a video Thumbnail", () => {
    const card = toCardWork(work({ thumbnail: upload(videoAsset()) }));

    expect(card?.visual).toEqual({
      kind: "video",
      source: { type: "file", url: "/assets/vid.mp4" },
      posterUrl: "/assets/poster.png",
      width: 640,
      height: 360,
      alt: "A video",
    });
  });

  it("falls back to the 16:9 aspect slot for a video without a poster", () => {
    const card = toCardWork(
      work({ thumbnail: upload(videoAsset({ poster: 99 })) }),
    );

    expect(card?.visual).toEqual({
      kind: "video",
      source: { type: "file", url: "/assets/vid.mp4" },
      posterUrl: null,
      width: VIDEO_ASPECT_FALLBACK.width,
      height: VIDEO_ASPECT_FALLBACK.height,
      alt: "A video",
    });
  });

  it("maps an embedded video Thumbnail to its YouTube source and ingested poster", () => {
    const card = toCardWork(
      work({
        thumbnail: embed({
          poster: imageAsset({
            id: 5,
            url: "/assets/youtube-poster.jpg",
            width: 1280,
            height: 720,
          }),
        }),
      }),
    );

    expect(card?.visual).toEqual({
      kind: "video",
      source: { type: "youtube", videoId: "dQw4w9WgXcQ" },
      posterUrl: "/assets/youtube-poster.jpg",
      width: 1280,
      height: 720,
      alt: "An embedded video",
    });
  });

  it("falls back to the 16:9 aspect slot for an embed without a poster", () => {
    const card = toCardWork(work({ thumbnail: embed({ poster: null }) }));

    expect(card?.visual).toEqual({
      kind: "video",
      source: { type: "youtube", videoId: "dQw4w9WgXcQ" },
      posterUrl: null,
      width: VIDEO_ASPECT_FALLBACK.width,
      height: VIDEO_ASPECT_FALLBACK.height,
      alt: "An embedded video",
    });
  });

  it("drops an embed whose video ID has not been derived yet", () => {
    expect(toCardWork(work({ thumbnail: embed({ videoId: null }) }))).toBeNull();
  });

  it("maps a missing slug to the empty string", () => {
    expect(toCardWork(work({ slug: undefined }))?.slug).toBe("");
  });
});
