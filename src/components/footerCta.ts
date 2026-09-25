/**
 * Pure helpers for the Footer's Contact CTA. The section renders only with
 * content, so blank fields read as absent — a mid-edit Live Preview state,
 * like the Landing Page's sections. Both actions render only when their
 * label is filled; the label-less secondary is simply not offered.
 */

export interface FooterCtaContent {
  eyebrow: string | null;
  headline: string | null;
  body: string | null;
  actionLabel: string | null;
  actionUrl: string | null;
  secondaryActionLabel: string | null;
  secondaryActionUrl: string | null;
}

// Structural stand-in for the CMS group.
interface CtaGroup {
  eyebrow?: string | null;
  headline?: string | null;
  body?: string | null;
  actionLabel?: string | null;
  actionUrl?: string | null;
  secondaryActionLabel?: string | null;
  secondaryActionUrl?: string | null;
}

const text = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export const toFooterCta = (cta: CtaGroup | null | undefined): FooterCtaContent => ({
  eyebrow: text(cta?.eyebrow),
  headline: text(cta?.headline),
  body: text(cta?.body),
  actionLabel: text(cta?.actionLabel),
  actionUrl: text(cta?.actionUrl),
  secondaryActionLabel: text(cta?.secondaryActionLabel),
  secondaryActionUrl: text(cta?.secondaryActionUrl),
});

// The URLs alone never show the section — they only complete their buttons.
export const hasFooterCtaContent = (cta: FooterCtaContent): boolean =>
  cta.eyebrow !== null ||
  cta.headline !== null ||
  cta.body !== null ||
  cta.actionLabel !== null ||
  cta.secondaryActionLabel !== null;
