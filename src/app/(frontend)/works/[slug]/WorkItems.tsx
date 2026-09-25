import Image from "next/image";
import { RichText } from "@payloadcms/richtext-lexical/react";

import type { Asset } from "@/payload-types";

import { AutoVideo } from "@/components/AutoVideo";
import {
  sizedUrlOf,
  VIDEO_ASPECT_FALLBACK,
  videoPosterOf,
  type AssetSizeName,
} from "@/components/work";
import type { WorkLayout } from "./WorkSections";

export type WorkItem = NonNullable<NonNullable<WorkLayout["items"]>[number]>;

const AssetFigure = ({
  asset,
  size,
}: {
  asset: number | Asset;
  size: AssetSizeName;
}) => {
  // The relationship can be empty or unpopulated while a Live Preview edit
  // is mid-flight — render nothing rather than crash.
  if (typeof asset !== "object" || asset === null || !asset.url) {
    return null;
  }

  // Video Items autoplay muted like the rest of the page's video; the poster
  // image sizes the grid cell until playback starts — its dimensions, not a
  // variant's, keep that slot honest.
  if (asset.mimeType?.startsWith("video/")) {
    const poster = videoPosterOf(asset);
    return (
      <figure className="h-full w-full">
        <AutoVideo
          alt={asset.alt}
          className="h-full w-full object-cover"
          height={poster?.height ?? VIDEO_ASPECT_FALLBACK.height}
          poster={poster ? sizedUrlOf(poster, size) : null}
          src={asset.url}
          width={poster?.width ?? VIDEO_ASPECT_FALLBACK.width}
        />
      </figure>
    );
  }

  return (
    <figure className="h-full w-full">
      {/* A sized Payload variant — the optimizer would only re-encode it. */}
      <Image
        src={sizedUrlOf(asset, size) ?? asset.url}
        alt={asset.alt}
        className="w-full h-full object-cover"
        unoptimized
        width={asset.width ?? 1}
        height={asset.height ?? 1}
      />
    </figure>
  );
};

// The text Item's Vertical Alignment as the flex justify utility it renders.
const textJustify = {
  top: "justify-start",
  center: "justify-center",
  bottom: "justify-end",
} as const;

export const WorkItemView = ({
  assetSize,
  item,
}: {
  assetSize: AssetSizeName;
  item: WorkItem;
}) => {
  switch (item.blockType) {
    case "title":
      return (
        <div className="p-8">
          <h2 className="text-[16px] font-semibold text-neutral-50">
            {item.title}
          </h2>
        </div>
      );
    case "titled-text":
      return (
        <div className="space-y-8 p-8">
          {(item.entries ?? []).map((entry, index) => (
            <div key={entry.id ?? index} className="space-y-2">
              <h3 className="text-[16px] text-neutral-600">{entry.title}</h3>
              <RichText data={entry.text} className="text-xl text-white" />
            </div>
          ))}
        </div>
      );
    case "text":
      return (
        <div
          className={`h-full space-y-8 p-8 flex flex-col ${
            textJustify[item.verticalAlignment ?? "bottom"]
          }`}
        >
          {(item.entries ?? []).map((entry, index) => (
            // One wrapper per entry keeps each paragraph separately targetable
            // by the animations planned for the real Work Detail Page.
            <div key={entry.id ?? index} className=" text-xl text-white">
              <RichText data={entry.text} />
            </div>
          ))}
        </div>
      );
    case "asset":
      return <AssetFigure asset={item.asset} size={assetSize} />;
  }
};
