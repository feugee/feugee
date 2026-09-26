"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type AssetImageProps = Omit<ImageProps, "onError" | "onLoad"> & {
  frameClassName?: string;
};

export const AssetImage = ({
  alt,
  className,
  frameClassName,
  ...imageProps
}: AssetImageProps) => {
  const [outcome, setOutcome] = useState<{
    src: ImageProps["src"];
    state: "loaded" | "error";
  } | null>(null);
  const state = outcome?.src === imageProps.src ? outcome.state : "loading";

  return (
    <span
      className={`relative isolate block overflow-hidden ${state === "loaded" ? "bg-transparent" : "bg-neutral-900"} ${frameClassName ?? ""}`}
      data-asset-frame
      data-asset-state={state}
    >
      <Image
        {...imageProps}
        alt={alt}
        aria-hidden={state === "error"}
        className={`${className ?? ""} transition-opacity duration-500 motion-reduce:transition-none ${state === "loading" || state === "error" ? "opacity-0" : ""}`}
        onError={() => setOutcome({ src: imageProps.src, state: "error" })}
        onLoad={() => setOutcome({ src: imageProps.src, state: "loaded" })}
      />
      {state === "error" && (
        <span
          aria-label={alt}
          className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-neutral-500"
          role="img"
        >
          Unavailable
        </span>
      )}
    </span>
  );
};
