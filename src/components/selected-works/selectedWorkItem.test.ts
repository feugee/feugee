import { describe, expect, it } from "vitest";

import type { Asset, Work } from "@/payload-types";

import { toSelectedWorkItem } from "./selectedWorkItem";

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

const videoAsset = (overrides: Partial<Asset> = {}): Asset =>
  ({
    id: 2,
    url: "/assets/feature.mp4",
    alt: "A feature video",
    mimeType: "video/mp4",
    width: null,
    height: null,
    poster: imageAsset({
      id: 3,
      url: "/assets/poster.png",
      width: 640,
      height: 360,
    }),
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

describe("toSelectedWorkItem", () => {
  it("extends the card core with the Work's Year", () => {
    expect(toSelectedWorkItem(work({ year: 2025 }))).toMatchObject({
      id: 10,
      slug: "fest-for-music",
      title: "Fest for Music",
      year: 2025,
    });
  });

  it("prefers a populated Feature Visual over the Thumbnail", () => {
    const item = toSelectedWorkItem(work({ featureVisual: upload(videoAsset()) }));

    expect(item?.visual).toEqual({
      kind: "video",
      source: { type: "file", url: "/assets/feature.mp4" },
      posterUrl: "/assets/poster.png",
      width: 640,
      height: 360,
      alt: "A feature video",
    });
  });

  it("prefers an embedded Feature Visual the same way", () => {
    const item = toSelectedWorkItem(
      work({
        featureVisual: {
          source: "embed",
          embed: {
            provider: "youtube",
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            alt: "An embedded feature",
            videoId: "dQw4w9WgXcQ",
            poster: imageAsset({
              id: 4,
              url: "/assets/embed-poster.jpg",
              width: 1280,
              height: 720,
            }),
          },
        },
      }),
    );

    expect(item?.visual).toEqual({
      kind: "video",
      source: { type: "youtube", videoId: "dQw4w9WgXcQ" },
      posterUrl: "/assets/embed-poster.jpg",
      width: 1280,
      height: 720,
      alt: "An embedded feature",
    });
  });

  it("falls back to the Thumbnail when the Work has no Feature Visual", () => {
    const item = toSelectedWorkItem(work({ featureVisual: undefined }));

    expect(item?.visual).toEqual({
      kind: "image",
      url: "/assets/img.png",
      width: 1600,
      height: 900,
      alt: "An image",
    });
  });

  it("falls back to the Thumbnail when the Feature Visual's upload is only shallow-populated", () => {
    const item = toSelectedWorkItem(work({ featureVisual: upload(9) }));

    expect(item?.visual).toMatchObject({ kind: "image", url: "/assets/img.png" });
  });

  it("shows a Work whose only visual is a Feature Visual", () => {
    const item = toSelectedWorkItem(
      work({
        thumbnail: undefined,
        featureVisual: upload(
          imageAsset({
            id: 4,
            url: "/assets/feature.png",
            alt: "A feature image",
          }),
        ),
      }),
    );

    expect(item?.visual).toEqual({
      kind: "image",
      url: "/assets/feature.png",
      width: 1600,
      height: 900,
      alt: "A feature image",
    });
  });

  it("maps a Work with no Year to null", () => {
    expect(toSelectedWorkItem(work({ year: null }))?.year).toBeNull();
  });

  it("defers the card guards to toCardWork (unpublished Work)", () => {
    expect(toSelectedWorkItem(work({ _status: "draft" }))).toBeNull();
  });
});
