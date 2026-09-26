"use client";

import { useEffect, useRef } from "react";

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
}: {
  alt: string;
  className?: string;
  height: number;
  poster?: string | null;
  src: string;
  width: number;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

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
    <video
      aria-label={alt}
      className={className}
      height={height}
      loop
      muted
      playsInline
      poster={poster ?? undefined}
      preload="none"
      ref={videoRef}
      src={src}
      width={width}
    />
  );
};
