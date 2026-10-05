import Image from "next/image";
import { RichText } from "@payloadcms/richtext-lexical/react";

import { AutoVideo } from "@/components/AutoVideo";
import { InteractiveYouTube } from "@/components/InteractiveYouTube";
import { videoSourceVisualOf, type AssetSizeName } from "@/components/work";
import type { WorkLayout } from "./WorkSections";

export type WorkItem = NonNullable<NonNullable<WorkLayout["items"]>[number]>;

/** The asset Item's Video Source group — the upload-or-embed either/or. */
export type AssetItemSource = Extract<
  WorkItem,
  { blockType: "asset" }
>["asset"];

const AssetFigure = ({
  source,
  size,
}: {
  source: AssetItemSource;
  size: AssetSizeName;
}) => {
  // The Video Source group resolves to one render-ready visual — upload or
  // embed. A relationship can be empty or unpopulated while a Live Preview
  // edit is mid-flight, and an embed without its derived video ID is the
  // same kind of half-state — render nothing rather than crash.
  const visual = videoSourceVisualOf(source, size);
  if (visual === null) {
    return null;
  }

  // Embedded Video Items are click-to-play with sound and the site's
  // controls; uploaded video Assets stay ambient (ADR 0014). The poster
  // image sizes the grid cell until playback starts — its dimensions, not a
  // variant's, keep that slot honest.
  if (visual.kind === "video") {
    return (
      <figure className="h-full w-full rounded-md overflow-hidden">
        {visual.source.type === "youtube" ? (
          <InteractiveYouTube
            alt={visual.alt}
            frameClassName="h-full w-full"
            height={visual.height}
            poster={visual.posterUrl}
            videoId={visual.source.videoId}
            width={visual.width}
          />
        ) : (
          <AutoVideo
            alt={visual.alt}
            className="h-full w-full object-cover"
            height={visual.height}
            poster={visual.posterUrl}
            src={visual.source.url}
            width={visual.width}
          />
        )}
      </figure>
    );
  }

  return (
    <figure className="h-full w-full rounded-md overflow-hidden">
      {/* A sized Payload variant — the optimizer would only re-encode it. */}
      <Image
        src={visual.url}
        alt={visual.alt}
        className="w-full h-full object-cover"
        width={visual.width}
        height={visual.height}
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
        <div className="p-6 lg:p-12">
          <h2 className="text-xl font-semibold text-neutral-50">
            {item.title}
          </h2>
        </div>
      );
    case "titled-text":
      return (
        <div className="space-y-8 p-6 lg:p-12">
          {(item.entries ?? []).map((entry, index) => (
            <div key={entry.id ?? index} className="space-y-2">
              <h3 className="text-xl text-neutral-600">{entry.title}</h3>
              <RichText
                data={entry.text}
                className="text-2xl text-white [&_blockquote]:border-l-2 [&_blockquote]:border-primary-500 [&_blockquote]:pl-4 [&_blockquote]:font-bold"
              />
            </div>
          ))}
        </div>
      );
    case "text":
      return (
        <div
          className={`h-full space-y-8 p-6 lg:p-12 flex flex-col ${
            textJustify[item.verticalAlignment ?? "bottom"]
          }`}
        >
          {(item.entries ?? []).map((entry, index) => (
            // One wrapper per entry keeps each paragraph separately targetable
            // by the animations planned for the real Work Detail Page.
            <div key={entry.id ?? index} className=" text-xl text-white">
              <RichText
                data={entry.text}
                className="text-2xl text-white [&_blockquote]:border-l-2 [&_blockquote]:border-primary-500 [&_blockquote]:pl-4 [&_blockquote]:font-bold"
              />
            </div>
          ))}
        </div>
      );
    case "asset":
      return <AssetFigure source={item.asset} size={assetSize} />;
  }
};
