"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Ambient video in the koto.com style: muted, looping, inline, no controls.
 * An IntersectionObserver plays it while it is near the viewport and pauses it
 * offscreen, so a wall of video Assets only ever streams the ones in view.
 * The width/height attributes hold the slot (poster dimensions when known) so
 * layout never waits for video data.
 */
export const AutoVideo = ({
  alt,
  className,
  height,
  poster,
  src,
  width,
  frameClassName,
}: {
  alt: string;
  className?: string;
  height: number;
  poster?: string | null;
  src: string;
  width: number;
  frameClassName?: string;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaState, setMediaState] = useState<{
    src: string;
    poster: string | null;
    posterReady: boolean;
    posterFailed: boolean;
    frameReady: boolean;
    videoFailed: boolean;
  } | null>(null);
  const currentState =
    mediaState?.src === src && mediaState.poster === (poster ?? null)
      ? mediaState
      : {
          src,
          poster: poster ?? null,
          posterReady: false,
          posterFailed: false,
          frameReady: false,
          videoFailed: false,
        };
  const ready = currentState.posterReady || currentState.frameReady;
  const failed =
    !ready &&
    (currentState.posterFailed || (!poster && currentState.videoFailed));

  const updateMediaState = useCallback(
    (update: (state: typeof currentState) => typeof currentState) => {
      setMediaState((state) => {
        const current =
          state?.src === src && state.poster === (poster ?? null)
            ? state
            : {
                src,
                poster: poster ?? null,
                posterReady: false,
                posterFailed: false,
                frameReady: false,
                videoFailed: false,
              };
        return update(current);
      });
    },
    [poster, src],
  );

  useEffect(() => {
    if (!poster) return;
    const image = new window.Image();
    image.onload = () =>
      updateMediaState((state) => ({ ...state, posterReady: true }));
    image.onerror = () =>
      updateMediaState((state) => ({ ...state, posterFailed: true }));
    image.src = poster;
  }, [poster, src, updateMediaState]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // React sets `muted` as a property, not an attribute — some autoplay
    // policies check the attribute, so set the property here before play().
    video.muted = true;

    // Reduced-motion visitors keep the poster frame; nothing autoplays.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void video.play().catch(() => {
            // Autoplay refused (battery saver, cold start) — the poster
            // frame stays put, nothing to recover.
          });
        } else {
          video.pause();
        }
      },
      // Begin slightly before the video scrolls into view so it is already
      // moving when it arrives.
      { rootMargin: "25% 0px" },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <span
      className={`relative isolate block overflow-hidden bg-neutral-900 ${frameClassName ?? ""}`}
      data-asset-frame
      data-asset-state={ready ? "loaded" : failed ? "error" : "loading"}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <video
        aria-hidden={failed}
        aria-label={alt}
        className={`${className ?? ""} transition-opacity duration-500 motion-reduce:transition-none ${ready ? "opacity-100" : "opacity-0"}`}
        height={height}
        loop
        muted
        onError={() =>
          updateMediaState((state) => ({ ...state, videoFailed: true }))
        }
        onLoadedData={() =>
          updateMediaState((state) => ({ ...state, frameReady: true }))
        }
        playsInline
        poster={poster ?? undefined}
        preload="none"
        ref={videoRef}
        src={src}
        width={width}
      />
      {failed && (
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
