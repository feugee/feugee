/**
 * The YouTube IFrame Player API loader, shared by every player component
 * (ambient and interactive alike). The script loads once per page no matter
 * how many players mount, and always runs against youtube-nocookie.com
 * without consent gating (ADR 0010).
 */

export type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  mute: () => void;
  unMute: () => void;
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getIframe: () => HTMLIFrameElement;
};

export type YTPlayerEvent = { data: number };

export type YTPlayerConstructor = new (
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

// YT.PlayerState values the players discriminate on. The ambient player
// reveals the iframe in exactly one state — playing — because everything
// else YouTube paints over a non-playing embed (the pause button, the
// corner logo, the "more videos" shelf) must stay behind the poster.
export const YT_STATE_ENDED = 0;
export const YT_STATE_PLAYING = 1;
export const YT_STATE_PAUSED = 2;

// The first PLAYING after a tab return or quality switch is often followed
// immediately by buffering — and YouTube paints its paused face during the
// dip. Play must hold for this long before the iframe is revealed.
export const REVEAL_SETTLE_MS = 250;

let youTubeApiPromise: Promise<YTPlayerConstructor> | null = null;

/** The IFrame API script, loaded once per page no matter how many players. */
export const loadYouTubePlayerApi = (): Promise<YTPlayerConstructor> => {
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
