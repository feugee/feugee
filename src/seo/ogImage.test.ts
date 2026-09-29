import { describe, expect, it } from "vitest";

import type { Asset, LandingPage, Work } from "@/payload-types";

import { ogImageOf, heroOgImage, videoSourceOgOf } from "./ogImage";

const imageAsset = (overrides: Partial<Asset> = {}): Asset =>
  ({
    id: 1,
    url: "/api/files/assets/original.png",
    alt: "An image",
    mimeType: "image/png",
    width: 1600,
    height: 900,
    updatedAt: "2026-09-01T00:00:00.000Z",
    createdAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  }) as unknown as Asset;

const videoAsset = (overrides: Partial<Asset> = {}): Asset =>
  ({
    id: 2,
    url: "/api/files/assets/original.mp4",
    alt: "A video",
    mimeType: "video/mp4",
    width: null,
    height: null,
    updatedAt: "2026-09-01T00:00:00.000Z",
    createdAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  }) as unknown as Asset;

const hero = (
  slides: (LandingPage["hero"] & object)["slides"],
): LandingPage["hero"] => ({ slides });

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

describe("ogImageOf", () => {
  it("picks the desktop variant of an image Asset", () => {
    const asset = imageAsset({
      sizes: {
        thumbnail: { url: "/t.webp", width: 640, height: 360 },
        desktop: { url: "/d.webp", width: 1600, height: 900 },
      },
    });

    expect(ogImageOf(asset)).toEqual({
      url: "/d.webp",
      width: 1600,
      height: 900,
      alt: "An image",
    });
  });

  it("falls back to the original when the Asset has no variants", () => {
    expect(ogImageOf(imageAsset())).toEqual({
      url: "/api/files/assets/original.png",
      width: 1600,
      height: 900,
      alt: "An image",
    });
  });

  it("omits dimensions an unmeasured image Asset cannot offer", () => {
    expect(ogImageOf(imageAsset({ width: null, height: null }))).toEqual({
      url: "/api/files/assets/original.png",
      alt: "An image",
    });
  });

  it("stands a video Asset's poster in as the image", () => {
    const poster = imageAsset({
      id: 3,
      url: "/api/files/assets/poster.png",
      sizes: { desktop: { url: "/poster-d.webp", width: 1600, height: 900 } },
    });

    expect(ogImageOf(videoAsset({ poster }))).toEqual({
      url: "/poster-d.webp",
      width: 1600,
      height: 900,
      alt: "An image",
    });
  });

  it("drops a video Asset without a populated poster", () => {
    expect(ogImageOf(videoAsset({ poster: 99 }))).toBeNull();
    expect(ogImageOf(videoAsset({ poster: null }))).toBeNull();
  });

  it("drops null, undefined, and a shallow-populated bare ID", () => {
    expect(ogImageOf(null)).toBeNull();
    expect(ogImageOf(undefined)).toBeNull();
    expect(ogImageOf(7)).toBeNull();
  });
});

describe("videoSourceOgOf", () => {
  it("uses the upload branch's own image face", () => {
    expect(videoSourceOgOf(upload(imageAsset()))).toEqual({
      url: "/api/files/assets/original.png",
      width: 1600,
      height: 900,
      alt: "An image",
    });
  });

  it("stands an embed's ingested poster in as the image", () => {
    const poster = imageAsset({
      id: 3,
      url: "/api/files/assets/youtube.jpg",
      sizes: { desktop: { url: "/youtube-d.webp", width: 1600, height: 900 } },
    });

    expect(videoSourceOgOf(embed({ poster }))).toEqual({
      url: "/youtube-d.webp",
      width: 1600,
      height: 900,
      alt: "An image",
    });
  });

  it("drops an embed without a populated poster", () => {
    expect(videoSourceOgOf(embed({ poster: 99 }))).toBeNull();
    expect(videoSourceOgOf(embed({ poster: null }))).toBeNull();
  });

  it("drops null, undefined, and an empty group", () => {
    expect(videoSourceOgOf(null)).toBeNull();
    expect(videoSourceOgOf(undefined)).toBeNull();
    expect(videoSourceOgOf({})).toBeNull();
  });
});

describe("heroOgImage", () => {
  it("uses the first Slide's video poster", () => {
    const poster = imageAsset({
      url: "/api/files/assets/slide.png",
      sizes: { desktop: { url: "/slide-d.webp", width: 1600, height: 900 } },
    });

    expect(
      heroOgImage(hero([{ video: upload(videoAsset({ poster })) }])),
    ).toEqual({
      url: "/slide-d.webp",
      width: 1600,
      height: 900,
      alt: "An image",
    });
  });

  it("skips posterless Slides to the first one with a poster", () => {
    const poster = imageAsset({
      id: 4,
      url: "/api/files/assets/second.png",
      sizes: { desktop: { url: "/second-d.webp", width: 1600, height: 900 } },
    });

    const result = heroOgImage(
      hero([
        { video: upload(videoAsset()) },
        { video: upload(videoAsset({ poster })) },
      ]),
    );

    expect(result).toEqual({
      url: "/second-d.webp",
      width: 1600,
      height: 900,
      alt: "An image",
    });
  });

  it("drops a Slide whose video's upload is only shallow-populated", () => {
    const poster = imageAsset({
      id: 5,
      url: "/api/files/assets/second.png",
      sizes: { desktop: { url: "/second-d.webp", width: 1600, height: 900 } },
    });

    const result = heroOgImage(
      hero([{ video: upload(12) }, { video: upload(videoAsset({ poster })) }]),
    );

    expect(result).toEqual({
      url: "/second-d.webp",
      width: 1600,
      height: 900,
      alt: "An image",
    });
  });

  it("uses an embedded Slide's ingested poster", () => {
    const poster = imageAsset({
      id: 6,
      url: "/api/files/assets/embed.jpg",
      sizes: { desktop: { url: "/embed-d.webp", width: 1600, height: 900 } },
    });

    expect(heroOgImage(hero([{ video: embed({ poster }) }]))).toEqual({
      url: "/embed-d.webp",
      width: 1600,
      height: 900,
      alt: "An image",
    });
  });

  it("is null with no Slides or no usable poster among them", () => {
    expect(heroOgImage(hero(null))).toBeNull();
    expect(heroOgImage(hero([]))).toBeNull();
    expect(heroOgImage(hero([{ video: upload(videoAsset()) }]))).toBeNull();
    expect(heroOgImage(hero([{ video: embed({ poster: null }) }]))).toBeNull();
    expect(heroOgImage(undefined)).toBeNull();
  });
});
