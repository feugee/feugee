"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Ambient playback for an Embedded Video (CONTEXT.md) — the YouTube twin of
 * AutoVideo's contract: muted, looping, controls-free, plays only while on
 * screen (or while its slide is active).
 * The player mounts lazily — nothing touches Google's servers until the
 * video actually scrolls into view — and runs against youtube-nocookie.com
 * without consent gating (ADR 0010). YouTube's own overlays (pause button,
 * logo, "more videos" shelf) render inside a cross-origin iframe that
 * nothing in this page — CSS, wrapper, or library — can reach into, so the
 * component covers them instead: the iframe ignores pointers, hides to the
 * poster instantly in any player state but settled playback, and fades in
 * only once play has held.
 */

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  mute: () => void;
  destroy: () => void;
  getIframe: () => HTMLIFrameElement;
};

type YTPlayerEvent = { data: number };

type YTPlayerConstructor = new (
  element: HTMLElement,
  options: {
    videoId: string;
    host?: string;
    width?: string | number;
    height?: string | number;
    playerVars: Record<string, string | number>;
    events: {
      onReady?: () => void;
      onError?: (event: YTPlayerEvent) => void;
      onStateChange?: (event: YTPlayerEvent) => void;
    };
  },
) => YTPlayer;

declare global {
  interface Window {
    YT?: { Player: YTPlayerConstructor };
    onYouTubeIframeAPIReady?: () => void;
  }
}

// YT.PlayerState values the visibility logic discriminates on. The paused
// face is everything YouTube paints over a non-playing embed — the center
// pause button, the corner logo, the "more videos" shelf — and YouTube will
// flash it even over a "playing" player whose frames stopped (background
// tab, slow buffer). So the iframe is revealed in exactly one state:
// playing. Every other state hides to the poster beneath.
const YT_STATE_ENDED = 0;
const YT_STATE_PLAYING = 1;

// The first PLAYING after a tab return or quality switch is often followed
// immediately by buffering — and YouTube paints its paused face during the
// dip. Play must hold for this long before the iframe is revealed.
const REVEAL_SETTLE_MS = 250;

let youTubeApiPromise: Promise<YTPlayerConstructor> | null = null;

/** The IFrame API script, loaded once per page no matter how many players. */
const loadYouTubePlayerApi = (): Promise<YTPlayerConstructor> => {
  if (youTubeApiPromise !== null) return youTubeApiPromise;

  youTubeApiPromise = new Promise((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT.Player);
      return;
    }
    // Chain, not clobber — another loader may have claimed the global.
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT?.Player) resolve(window.YT.Player);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      youTubeApiPromise = null;
      reject(new Error("YouTube IFrame API failed to load"));
    };
    document.head.appendChild(script);
  });

  return youTubeApiPromise;
};

export const AmbientYouTube = ({
  alt,
  frameClassName,
  height,
  playing,
  poster,
  videoId,
  width,
}: {
  alt: string;
  frameClassName?: string;
  height: number;
  /** Controlled playback (the Hero Slider's active slide); omit to let the
   *  component decide from its own viewport observer. */
  playing?: boolean;
  poster?: string | null;
  videoId: string;
  width: number;
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const shouldPlayRef = useRef(false);
  const altRef = useRef(alt);
  const revealTimeoutRef = useRef<number | undefined>(undefined);
  const [activated, setActivated] = useState(false);
  const [inView, setInView] = useState(false);
  const [showing, setShowing] = useState(false);

  const shouldPlay = playing ?? inView;

  // The player mounts on the first frame it is actually wanted — derived
  // during render rather than in an effect, so activation is a plain
  // function of shouldPlay and never cascades.
  if (shouldPlay && !activated) setActivated(true);

  useEffect(() => {
    altRef.current = alt;
    shouldPlayRef.current = shouldPlay;
  });

  // Self-managed mode mirrors AutoVideo: begin slightly before the video
  // scrolls into view so it is already moving when it arrives.
  useEffect(() => {
    if (playing !== undefined) return;
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "25% 0px" },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [playing]);

  // The player mounts once — on the first frame it is actually wanted — and
  // is then only played and paused, never torn down for scrolling out (a
  // remount would reload the iframe every time). A changed videoId rebuilds.
  useEffect(() => {
    if (!activated) return;
    const container = hostRef.current;
    if (!container) return;
    // A rebuilt player (changed videoId) starts covered — the old player's
    // last revealed state must not bleed into the new iframe's first paint.
    setShowing(false);

    let cancelled = false;
    let player: YTPlayer | null = null;

    const hideNow = () => {
      window.clearTimeout(revealTimeoutRef.current);
      setShowing(false);
    };

    loadYouTubePlayerApi()
      .then((Player) => {
        if (cancelled || playerRef.current !== null) return;
        // The API swaps its mount element for an iframe, so the mount is an
        // imperatively-created div React never tracks — destroying it can
        // never clash with React's own DOM bookkeeping.
        const mount = document.createElement("div");
        container.appendChild(mount);
        player = new Player(mount, {
          videoId,
          height: "100%",
          host: "https://www.youtube-nocookie.com",
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            loop: 1,
            modestbranding: 1,
            mute: 1,
            // loop=1 only loops when playlist points at the same video.
            playlist: videoId,
            playsinline: 1,
            rel: 0,
          },
          width: "100%",
          events: {
            onReady: () => {
              if (cancelled) {
                player?.destroy();
                return;
              }
              playerRef.current = player;
              player?.mute();
              if (player) player.getIframe().title = altRef.current;
              if (shouldPlayRef.current) player?.playVideo();
            },
            onError: () => {
              // Deleted, private, or embedding disabled — tear the player
              // down and let the poster stand in permanently.
              setShowing(false);
              player?.destroy();
              if (playerRef.current === player) playerRef.current = null;
            },
            onStateChange: (event) => {
              if (cancelled) return;
              if (event.data === YT_STATE_PLAYING) {
                // Revealed only once play has settled — the first PLAYING
                // after a tab return or quality switch is often followed by
                // buffering, and the face painted during that dip must stay
                // behind the poster.
                window.clearTimeout(revealTimeoutRef.current);
                revealTimeoutRef.current = window.setTimeout(
                  () => setShowing(true),
                  REVEAL_SETTLE_MS,
                );
                return;
              }
              if (event.data === YT_STATE_ENDED) {
                // loop=1 does not always survive quality switches — restart
                // by hand, and hide the end screen while it happens.
                hideNow();
                player?.seekTo(0, true);
                player?.playVideo();
                return;
              }
              // Unstarted, buffering, paused, cued: all hide, instantly.
              hideNow();
            },
          },
        });
      })
      .catch(() => {
        // The API script failed to load (offline, blocked) — the poster
        // stands in, same as any dead video.
        setShowing(false);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(revealTimeoutRef.current);
      player?.destroy();
      if (playerRef.current === player) playerRef.current = null;
    };
  }, [activated, videoId]);

  useEffect(() => {
    if (!shouldPlay) {
      playerRef.current?.pauseVideo();
    } else {
      playerRef.current?.playVideo();
    }
  }, [shouldPlay]);

  // Background tabs: a muted player can keep "playing" with no state
  // change, and state events only arrive here via postMessage — after the
  // iframe has already painted whatever it plans to show. So both tab
  // switches cover first, synchronously: the iframe hides this frame, the
  // pending reveal is cancelled, and only a settled PLAYING lifts the
  // cover again.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (!shouldPlayRef.current) return;
      window.clearTimeout(revealTimeoutRef.current);
      setShowing(false);
      if (document.visibilityState === "hidden") {
        playerRef.current?.pauseVideo();
      } else {
        playerRef.current?.playVideo();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  return (
    <span
      className={`relative isolate block overflow-hidden bg-neutral-900 ${frameClassName ?? ""}`}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {poster && (
        /* An already-sized Payload variant — the optimizer would only
           re-encode it (the site-wide rule for Asset variants). */
        <Image
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
          height={height}
          src={poster}
          unoptimized
          width={width}
        />
      )}
      <div
        aria-hidden={Boolean(poster)}
        className={`pointer-events-none absolute inset-0 [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:h-full [&>iframe]:w-full ${
          showing
            ? // Revealing fades in over the poster.
              "opacity-100 transition-opacity duration-500"
            : // Hiding is instant — YouTube paints its paused face inside
              // the iframe before the state event crosses the origin
              // boundary, so a fade here would show it through.
              "opacity-0"
        }`}
        ref={hostRef}
      />
    </span>
  );
};
