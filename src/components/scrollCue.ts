/**
 * The Scroll Cue's rendering rule, resolved once away from the markup: a
 * filled label with a URL navigates there, a filled label without one
 * smooth-scrolls to the content below the Hero, and anything else — no
 * label, whatever the URL says — does not render at all.
 */

export type ScrollCueAction =
  | { kind: "hidden" }
  | { kind: "scroll"; label: string }
  | { kind: "link"; label: string; url: string };

// Structural stand-in for the CMS group.
interface ScrollCueGroup {
  label?: string | null;
  url?: string | null;
}

export const resolveScrollCue = (
  cue: ScrollCueGroup | null | undefined,
): ScrollCueAction => {
  const label = cue?.label?.trim();
  if (!label) return { kind: "hidden" };

  const url = cue?.url?.trim();
  return url ? { kind: "link", label, url } : { kind: "scroll", label };
};
