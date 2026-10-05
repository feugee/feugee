"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { type PointerEvent as ReactPointerEvent } from "react";

import { formatTime, seekRatioOf } from "@/components/interactiveVideo";
import {
  registerPlayer,
  suspendOthers,
} from "@/components/playbackCoordinator";
import {
  loadYouTubePlayerApi,
  REVEAL_SETTLE_MS,
  YT_STATE_ENDED,
  YT_STATE_PAUSED,
  YT_STATE_PLAYING,
  type YTPlayer,
} from "@/components/youtubePlayerApi";

/**
 * Interactive playback for an Embedded Video (CONTEXT.md) in a Work's
 * content surfaces — the Work Detail Page's hero and its Layout Items: the
 * visitor starts it from the Poster, with sound, and drives it with the
 * site's own controls (play/pause, mute, seek, time) that auto-hide during
 * playback. The ambient twin used by the Hero's Slides and the card
 * Thumbnails is AmbientYouTube; uploaded video Assets never use this — they
 * stay ambient everywhere (ADR 0014).
 *
 * Nothing touches Google's servers until the visitor actually clicks play —
 * stricter than the ambient player, which mounts in viewport — and the
 * player runs against youtube-nocookie.com without consent gating (ADR
 * 0010). Like the ambient twin, the iframe ignores pointers and YouTube's
 * own overlays stay behind the poster until play has settled; unlike it, a
 * deliberately paused video keeps its revealed frame — that pause face is
 * the visitor's own doing.
 *
 * A deliberately started video keeps playing in a background tab, like every
 * web video player; only ambient playback is paused on tab switches.
 */

type Playback = "loading" | "playing" | "paused" | "ended";

// Controls reappear on any interaction and hide again after this much
// stillness during playback; whenever the video is not playing they stay.
const AUTO_HIDE_MS = 2000;
// How often the elapsed clock reads the player while playing.
const POLL_MS = 250;

// Coarse pointers tap to summon the controls rather than toggling playback —
// tap-to-pause is a fine-pointer convention and misfires on touch.
const isFinePointer = () =>
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

const PlayGlyph = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M9 6.5v11l9-5.5z" />
  </svg>
);

const PauseGlyph = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M9 6v12M15 6v12" strokeLinecap="round" />
  </svg>
);

const SoundGlyph = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
  </svg>
);

const MutedGlyph = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
    <path d="m16.5 9.5 5 5M21.5 9.5l-5 5" />
  </svg>
);

const ReplayGlyph = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M3 4v6h6" />
    <path d="M4.2 14.5A8.5 8.5 0 1 0 6 6.1L3 10" />
  </svg>
);

export const InteractiveYouTube = ({
  alt,
  frameClassName,
  height,
  poster,
  videoId,
  width,
}: {
  alt: string;
  frameClassName?: string;
  height: number;
  poster?: string | null;
  videoId: string;
  width: number;
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const altRef = useRef(alt);
  const revealTimeoutRef = useRef<number | undefined>(undefined);
  const hoveringRef = useRef(false);
  const lastInteractionRef = useRef(0);

  const [started, setStarted] = useState(false);
  const [showing, setShowing] = useState(false);
  const [playback, setPlayback] = useState<Playback>("loading");
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scrubRatio, setScrubRatio] = useState<number | null>(null);
  // Hover-or-recent-interaction while playing. Derived with the playback
  // state into the controls' visibility: not playing, they simply stay.
  const [engaged, setEngaged] = useState(true);

  useEffect(() => {
    altRef.current = alt;
  });

  // The controls' visibility, derived: hidden only while playing and
  // disengaged — no hover, no recent interaction.
  const controlsShown = playback !== "playing" || engaged;

  // The exclusivity self-handle is stable for the player's lifetime; a
  // suspension before the player exists must survive until onReady, or two
  // quickly-started videos would both come up playing (autoplay=1).
  const preemptedRef = useRef(false);
  const self = useMemo(
    () => ({
      pause: () => {
        preemptedRef.current = true;
        playerRef.current?.pauseVideo();
      },
    }),
    [],
  );

  useEffect(() => registerPlayer(self), [self]);

  const bumpInteraction = () => {
    lastInteractionRef.current = Date.now();
    setEngaged(true);
  };

  const resume = () => {
    const player = playerRef.current;
    if (!player) return;
    preemptedRef.current = false;
    suspendOthers(self);
    if (playback === "ended") player.seekTo(0, true);
    player.playVideo();
  };

  const togglePlay = () => {
    if (playback === "playing") {
      playerRef.current?.pauseVideo();
      return;
    }
    resume();
  };

  const toggleMute = () => {
    const player = playerRef.current;
    if (!player) return;
    if (muted) {
      player.unMute();
      setMuted(false);
    } else {
      player.mute();
      setMuted(true);
    }
  };

  // The video surface before first play and after the end: the whole frame
  // is the button, announced as play/replay and carrying the Cursor's Play
  // state. Once started, the surface toggles playback on a fine pointer and
  // only summons the controls on a coarse one.
  const onSurfaceActivate = () => {
    if (!started) {
      preemptedRef.current = false;
      suspendOthers(self);
      bumpInteraction();
      setStarted(true);
      return;
    }
    resume();
  };

  const onSurfaceToggle = () => {
    if (!isFinePointer()) {
      // Touch: a tap toggles the controls during playback; while paused or
      // ended the controls simply stay (the auto-hide decision) and a tap
      // does nothing to them.
      if (playback === "playing") {
        if (engaged) setEngaged(false);
        else bumpInteraction();
      }
      return;
    }
    bumpInteraction();
    togglePlay();
  };

  const onSeekPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    bumpInteraction();
    setScrubRatio(
      seekRatioOf(event.currentTarget.getBoundingClientRect(), event.clientX),
    );
  };

  const onSeekPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (scrubRatio === null) return;
    setScrubRatio(
      seekRatioOf(event.currentTarget.getBoundingClientRect(), event.clientX),
    );
  };

  const onSeekPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (scrubRatio === null) return;
    const ratio = seekRatioOf(
      event.currentTarget.getBoundingClientRect(),
      event.clientX,
    );
    setScrubRatio(null);
    const player = playerRef.current;
    if (player && duration > 0) {
      player.seekTo(ratio * duration, true);
      // Scrubbing away from the end is a resume of sorts — but of a paused
      // player; the visitor never asked for sound to start here.
      if (playback === "ended") setPlayback("paused");
    }
  };

  const onSeekPointerCancel = () => {
    setScrubRatio(null);
  };

  // The player mounts on the visitor's first click — the poster carries
  // everything before that — and is then only played and paused. A changed
  // videoId rebuilds.
  useEffect(() => {
    if (!started) return;
    const container = hostRef.current;
    if (!container) return;
    // A rebuilt player starts covered — the old player's last revealed
    // state must not bleed into the new iframe's first paint.
    setShowing(false);

    let cancelled = false;
    let player: YTPlayer | null = null;

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
            // autoplay=1 with sound rides the click's user activation; the
            // onReady playVideo covers a browser that dropped it, and a
            // second click on the still-covered poster retries for good.
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            loop: 0,
            modestbranding: 1,
            mute: 0,
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
              if (player) {
                player.getIframe().title = altRef.current;
                const whole = player.getDuration();
                if (whole > 0) setDuration(whole);
                if (preemptedRef.current) player.pauseVideo();
                else player.playVideo();
              }
            },
            onError: () => {
              // Deleted, private, or embedding disabled — back to the
              // poster with its play affordance; a later click retries.
              window.clearTimeout(revealTimeoutRef.current);
              setShowing(false);
              setPlayback("loading");
              player?.destroy();
              if (playerRef.current === player) playerRef.current = null;
              setStarted(false);
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
                setPlayback("playing");
                return;
              }
              if (event.data === YT_STATE_ENDED) {
                window.clearTimeout(revealTimeoutRef.current);
                // The video stops on its final frame for the replay
                // affordance (ADR 0014) — it never silently loops.
                setShowing(true);
                setPlayback("ended");
                return;
              }
              if (event.data === YT_STATE_PAUSED) {
                const elapsed = player?.getCurrentTime();
                if (elapsed !== undefined) setCurrentTime(elapsed);
                setPlayback("paused");
                return;
              }
              // Buffering keeps the previous state; unstarted and cued are
              // the loading face. None of them move the reveal.
            },
          },
        });
      })
      .catch(() => {
        // The API script failed to load (offline, blocked) — the poster
        // stands in, same as any dead video.
        setShowing(false);
        setPlayback("loading");
      });

    return () => {
      cancelled = true;
      window.clearTimeout(revealTimeoutRef.current);
      player?.destroy();
      if (playerRef.current === player) playerRef.current = null;
    };
  }, [started, videoId]);

  // The elapsed clock reads the player only while it plays.
  useEffect(() => {
    if (playback !== "playing") return;
    const interval = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      setCurrentTime(player.getCurrentTime());
      const whole = player.getDuration();
      if (whole > 0) setDuration(whole);
    }, POLL_MS);
    return () => window.clearInterval(interval);
  }, [playback]);

  // While playing, the controls survive on hover or recent interaction and
  // fade after stillness; whenever not playing they simply stay, by
  // derivation. The tick lags at most one interval behind a hover.
  useEffect(() => {
    if (playback !== "playing") return;
    const interval = window.setInterval(() => {
      setEngaged(
        hoveringRef.current ||
          Date.now() - lastInteractionRef.current < AUTO_HIDE_MS,
      );
    }, 500);
    return () => window.clearInterval(interval);
  }, [playback]);

  const progress =
    scrubRatio ??
    (duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0);

  const surfaceActive = !started || playback === "ended";

  return (
    <span
      className={`relative isolate block overflow-hidden bg-neutral-900 ${frameClassName ?? ""}`}
      onPointerEnter={() => {
        hoveringRef.current = true;
        if (playback === "playing") setEngaged(true);
      }}
      onPointerLeave={() => {
        hoveringRef.current = false;
      }}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {poster && (
        /* An already-sized Payload variant — the optimizer would only
           re-encode it (the site-wide rule for Asset variants). Decorative:
           the play/replay button carries the video's name. */
        <Image
          alt=""
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
      {surfaceActive ? (
        <button
          aria-label={
            playback === "ended" ? `Replay video: ${alt}` : `Play video: ${alt}`
          }
          className="group absolute inset-0 flex items-center justify-center focus-visible:outline-none"
          data-cursor="play"
          onClick={onSurfaceActivate}
          type="button"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/40 text-white transition-transform duration-300 group-active:scale-90 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-primary-500">
            {playback === "ended" ? (
              <ReplayGlyph className="h-6 w-6" />
            ) : (
              <PlayGlyph className="h-6 w-6" />
            )}
          </span>
        </button>
      ) : (
        <div aria-hidden="true" className="absolute inset-0" onClick={onSurfaceToggle} />
      )}
      {started && (
        <div
          className={`absolute inset-x-0 bottom-0 z-10 flex items-center gap-3 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-10 transition-opacity duration-300 ${
            controlsShown ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <button
            aria-label={playback === "playing" ? "Pause" : "Play"}
            className="text-white focus-visible:text-primary-500 focus-visible:outline-none"
            onClick={() => {
              bumpInteraction();
              togglePlay();
            }}
            type="button"
          >
            {playback === "playing" ? (
              <PauseGlyph className="h-5 w-5" />
            ) : (
              <PlayGlyph className="h-5 w-5" />
            )}
          </button>
          <span className="text-xs tabular-nums text-white">
            {formatTime(currentTime)}
          </span>
          <div
            className="relative flex h-5 flex-1 cursor-pointer items-center"
            onPointerCancel={onSeekPointerCancel}
            onPointerDown={onSeekPointerDown}
            onPointerMove={onSeekPointerMove}
            onPointerUp={onSeekPointerUp}
          >
            <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-primary-500"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
          <span className="text-xs tabular-nums text-white">
            {formatTime(duration)}
          </span>
          <button
            aria-label={muted ? "Unmute" : "Mute"}
            className="text-white focus-visible:text-primary-500 focus-visible:outline-none"
            onClick={() => {
              bumpInteraction();
              toggleMute();
            }}
            type="button"
          >
            {muted ? (
              <MutedGlyph className="h-5 w-5" />
            ) : (
              <SoundGlyph className="h-5 w-5" />
            )}
          </button>
        </div>
      )}
    </span>
  );
};
