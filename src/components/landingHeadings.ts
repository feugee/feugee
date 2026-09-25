/**
 * Fallbacks for the Landing Page's CMS-editable section headings: blank
 * fields — never saved, or a mid-edit Live Preview state — fall back to the
 * defaults the fields seed with, so the sections never lose their heading.
 */

export const DEFAULT_SELECTED_WORKS_HEADING = "Selected Works";
export const DEFAULT_CLIENTS_HEADING = "Clients Ideas We've Visualized";

export const landingHeadingOf = (
  heading: string | null | undefined,
  fallback: string,
): string => heading?.trim() || fallback;
