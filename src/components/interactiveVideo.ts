/**
 * Pure helpers for the interactive Embedded Video player (InteractiveYouTube)
 * — the parts worth unit-testing without a YouTube iframe in sight.
 */

/** Seconds as m:ss — h:mm:ss past the hour — for the control bar's clock. */
export const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const whole = Math.floor(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secondDigits = String(whole % 60).padStart(2, "0");
  const minuteDigits =
    hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
  return hours > 0
    ? `${hours}:${minuteDigits}:${secondDigits}`
    : `${minuteDigits}:${secondDigits}`;
};

/** A pointer position on the seek track as a 0..1 fraction of its width. */
export const seekRatioOf = (
  trackRect: { left: number; width: number },
  clientX: number,
): number => {
  if (trackRect.width === 0) return 0;
  return Math.min(
    1,
    Math.max(0, (clientX - trackRect.left) / trackRect.width),
  );
};
