/**
 * Pure helpers for the Hero title. The agency-managed parts are the lead-in
 * word and the word list; both resolve here so the component and the
 * screen-reader twin can never disagree.
 */

// "Into" — the default Lead-In Word ahead of the Rotating Word on the title's
// second line; the CMS field seeds with this and may override it.
export const DEFAULT_HERO_LEAD_IN = "Into";

export const heroLeadInOf = (
  leadIn: string | null | undefined,
): string => leadIn?.trim() || DEFAULT_HERO_LEAD_IN;

// Structural stand-in for the CMS rows: wordless rows are a mid-edit Live
// Preview state, not an error.
interface RotatingWordRow {
  id?: string | null;
  word?: string | null;
}

export const normalizeRotatingWords = (
  rows: readonly RotatingWordRow[] | null | undefined,
): string[] =>
  (rows ?? []).flatMap((row) => {
    const word = row.word?.trim();
    return word ? [word] : [];
  });

export const accessibleHeroTitle = (
  title: string,
  words: readonly string[],
  leadIn: string,
): string =>
  words.length > 0 ? `${title} ${leadIn} ${words.join(", ")}` : title;
