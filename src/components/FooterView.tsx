"use client";

import Image from "next/image";
import Link from "next/link";
import { lazy, Suspense } from "react";

import type { Footer, Work } from "@/payload-types";

import { ArrowRight } from "./ArrowRight";
import { AutoVideo } from "./AutoVideo";
import { usePreviewRequested } from "./live-preview/usePreviewRequested";
import { hasFooterCtaContent, toFooterCta } from "./footerCta";
import { LogoMark } from "./LogoMark";
import { toMenuLinks } from "./menu";
import { navigateWithBlackout } from "./page-transition/navigateWithBlackout";
import { toSocialLinks } from "./socialPlatforms";
import { SwipeText } from "./SwipeText";
import { toCardWork, workThumbnailOf, type CardWork } from "./work";

// The Live Preview machinery rides a lazy chunk: it only downloads inside
// the CMS Dashboard's preview iframe, where the gate below has seen
// ?livePreview=footer. Anonymous visitors get the static chrome and none
// of this code.
const FooterLivePreview = lazy(() => import("./FooterLivePreview"));

interface FooterWorkCard extends CardWork {
  subtitle: string | null;
}

// The card guards (published, populated, usable Thumbnail) live in
// toCardWork; this adds only what the Footer's Other Works cards display.
// The cards share the footer row — roughly a quarter of its width on md+ —
// so they request the thumbnail variant.
const toFooterWorkCard = (work: number | Work): FooterWorkCard | null => {
  if (typeof work !== "object") return null;
  const card = toCardWork(work, workThumbnailOf(work, "thumbnail"));
  if (card === null) return null;

  return { ...card, subtitle: work.subtitle ?? null };
};

const WorkCard = ({
  item,
  isFirst,
}: {
  item: FooterWorkCard;
  isFirst: boolean;
}) => (
  <Link
    className="block w-full"
    href={`/works/${item.slug}`}
    onNavigate={(event) => navigateWithBlackout(event, `/works/${item.slug}`)}
  >
    <div
      className={`${
        isFirst
          ? "aspect-3/4 md:aspect-square"
          : "aspect-4/3 md:aspect-4/3 lg:aspect-square"
      } w-full overflow-hidden rounded bg-neutral-800`}
    >
      {item.visual.kind === "video" ? (
        <AutoVideo
          alt={item.visual.alt}
          className="h-full w-full object-cover"
          height={item.visual.height}
          poster={item.visual.posterUrl}
          src={item.visual.url}
          width={item.visual.width}
        />
      ) : (
        /* A sized Payload variant — the optimizer would only re-encode it. */
        <Image
          alt={item.visual.alt}
          className="h-full w-full object-cover"
          height={item.visual.height}
          src={item.visual.url}
          unoptimized
          width={item.visual.width}
        />
      )}
    </div>
    <div className="mt-3 space-y-1">
      <p className="text-base text-white font-bold">{item.title}</p>
      {item.subtitle && (
        <span className="text-sm text-neutral-500">{item.subtitle}</span>
      )}
    </div>
  </Link>
);

// Both column rows stack the same way below md — one class keeps them in step.
const columnRowClassName =
  "w-full flex flex-col-reverse md:flex-col gap-10 items-start lg:flex-row md:justify-between";

// Shared by both Contact CTA buttons and their fallback-button branches.
const ctaButtonClassName = `inline-flex items-center gap-2 hover:text-primary-500 transition px-6 py-4 rounded-[4px] border-neutral-800 border`;

// One button for both CTA actions — identical styling; they differ only in
// the resolved label and URL.
const CtaButton = ({
  label,
  url,
  primary,
}: {
  label: string;
  url: string | null;
  primary?: boolean;
}) =>
  url ? (
    <Link
      className={
        ctaButtonClassName + (primary ? " bg-white text-black" : " text-white")
      }
      href={url}
      onNavigate={(event) => navigateWithBlackout(event, url)}
    >
      {label} <ArrowRight />
    </Link>
  ) : (
    <button
      className={
        ctaButtonClassName + (primary ? " bg-white text-black" : " text-white")
      }
      type="button"
    >
      {label} <ArrowRight />
    </button>
  );

export const FooterView = ({ initialData }: { initialData: Footer }) => {
  const livePreview = usePreviewRequested("footer");
  const content = <FooterContent data={initialData} />;

  if (!livePreview) return content;

  // The static content doubles as the Suspense fallback, so the swap to the
  // live view is seamless while the chunk loads.
  return (
    <Suspense fallback={content}>
      <FooterLivePreview initialData={initialData} />
    </Suspense>
  );
};

export const FooterContent = ({ data }: { data: Footer }) => {
  const cta = toFooterCta(data.cta);

  const aboutHeading = data.about?.heading?.trim() || "About";
  const aboutDescription = data.about?.description?.trim() || null;
  const otherWorksHeading = data.otherWorksHeading?.trim() || "Other Works";
  const menuHeading = data.menuHeading?.trim() || "Menu";

  const otherWorks = (data.otherWorks ?? []).flatMap((work) => {
    const card = toFooterWorkCard(work);
    return card ? [card] : [];
  });

  const menuLinks = toMenuLinks(data.menuLinks);

  const contactHeading = data.contact?.heading?.trim() || "Contact Us";
  const callToAction = data.contact?.callToAction?.trim() || null;
  const callToActionUrl = data.contact?.callToActionUrl?.trim() || null;
  const email = data.contact?.email?.trim() || null;
  const phone = data.contact?.phone?.trim() || null;
  const showContact = callToAction !== null || email !== null || phone !== null;

  const copyrightName = data.copyrightName?.trim() || "Feugee";

  const socialLinks = toSocialLinks(data.socialLinks);

  return (
    /* The data attribute marks the Page Shift slab (ADR 0007). */
    // <footer
    //   className="mt-auto mx-auto max-w-360 bg-red-500 px-6 pt-6 flex flex-col gap-y-6 items-stretch justify-start bg-linear-to-t from-[#161616] to-neutral-950"
    //   data-blackout-slab
    // >
    <footer
      className="mt-auto mx-auto max-w-360 px-6 pt-6 flex flex-col gap-y-6 items-stretch justify-start bg-neutral-950"
      data-blackout-slab
    >
      {hasFooterCtaContent(cta) && (
        <section
          aria-label="Contact CTA"
          className="flex w-full flex-col items-center justify-center gap-y-8 py-24 text-center md:gap-y-12 md:py-32"
        >
          <div className="flex flex-col gap-y-6 items-center text-center">
            {cta.eyebrow && (
              <p className="text-lg text-neutral-300 md:text-xl">
                {cta.eyebrow}
              </p>
            )}
            {cta.headline && (
              <h2 className="text-4xl text-white font-bold md:text-7xl">
                {cta.headline}
              </h2>
            )}
            {cta.body && (
              <p className="text-lg text-neutral-300 md:text-xl">{cta.body}</p>
            )}
          </div>
          {(cta.actionLabel !== null || cta.secondaryActionLabel !== null) && (
            /* Both buttons share the row; each renders only with its label
                filled, so an empty secondary label leaves the primary alone. */
            <div className="flex flex-wrap items-center justify-center gap-4">
              {cta.secondaryActionLabel !== null && (
                <CtaButton
                  label={cta.secondaryActionLabel}
                  url={cta.secondaryActionUrl}
                />
              )}
              {cta.actionLabel !== null && (
                <CtaButton
                  primary
                  label={cta.actionLabel}
                  url={cta.actionUrl}
                />
              )}
            </div>
          )}
        </section>
      )}
      <div className="w-full flex flex-col gap-y-12 md:gap-y-16">
        <div className={columnRowClassName}>
          {aboutDescription && (
            <div className="space-y-3 w-full">
              <h2 className="text-base text-neutral-500">{aboutHeading}</h2>
              <p className="text-2xl text-white w-full md:w-[80%]">
                {aboutDescription}
              </p>
            </div>
          )}
          {otherWorks.length > 0 && (
            <div className="space-y-3 w-full">
              <h2 className="text-base text-neutral-500">
                {otherWorksHeading}
              </h2>
              <div className="w-full flex flex-col gap-y-4 gap-x-1 md:flex-row md:justify-end md:items-start">
                {otherWorks.map((item, index) => (
                  <WorkCard isFirst={index === 0} item={item} key={item.id} />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className={columnRowClassName}>
          {menuLinks.length > 0 && (
            <div className="space-y-4 w-full">
              <h2 className="text-base text-neutral-500">{menuHeading}</h2>
              <ul className="flex flex-col justify-start items-start gap-y-2">
                {menuLinks.map((link) => (
                  <li key={link.id}>
                    <Link
                      className="group text-base text-white"
                      href={link.url}
                      onNavigate={(event) =>
                        navigateWithBlackout(event, link.url)
                      }
                    >
                      <SwipeText>{link.label}</SwipeText>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {showContact && (
            <div className="space-y-4 w-full">
              <h2 className="text-base text-neutral-500">{contactHeading}</h2>
              {/* address marks the agency's own contact details; preflight
                  doesn't un-italicize it, so not-italic keeps the look. */}
              <address className="flex flex-col justify-start items-start gap-y-2 not-italic">
                {callToAction &&
                  (callToActionUrl ? (
                    <Link
                      className="text-base text-white"
                      href={callToActionUrl}
                      onNavigate={(event) =>
                        navigateWithBlackout(event, callToActionUrl)
                      }
                    >
                      {callToAction}
                    </Link>
                  ) : (
                    <span className="text-base text-white">{callToAction}</span>
                  ))}
                {email && (
                  <a className="text-base text-white" href={`mailto:${email}`}>
                    {email}
                  </a>
                )}
                {phone && (
                  <a
                    className="text-base text-white"
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                  >
                    {phone}
                  </a>
                )}
              </address>
            </div>
          )}
        </div>
      </div>
      {/* The Wordmark window: the logo artwork stretched edge-to-edge, its
          bottom quarter bleeding past the crop line on md+ (a -mb percentage
          resolves against the container's width, like the logo's own height),
          with the rule and bottom bar layered over its lower letters. Below
          md the letters are too short to spare, so the bar just follows them.
          The window's bottom edge is the footer's bottom edge. */}
      <div className="relative overflow-hidden">
        <div aria-hidden="true" className="w-full text-[#1F1F1F] md:mb-[-3%]">
          <LogoMark className="block h-auto w-full" monochrome />
        </div>
        <div className="relative z-10 pb-16 md:absolute md:inset-x-0 md:bottom-0">
          <div className="mb-16 h-px w-full bg-neutral-900" />
          <div className="w-full flex flex-wrap justify-between items-center gap-x-6 gap-y-3">
            <span className="text-sm text-neutral-500">
              &copy; {new Date().getFullYear()} {copyrightName}. All Rights
              Reserved.
            </span>
            {data.location && (
              <div className="text-sm text-neutral-500 flex items-center justify-start gap-x-3">
                <span>{data.location}</span>
              </div>
            )}
            {socialLinks.length > 0 && (
              <div className="flex justify-end items-center gap-x-3">
                {socialLinks.map(({ id, url, label, Icon }) => (
                  <a
                    aria-label={label}
                    className="border border-neutral-700 rounded p-2 text-neutral-500 transition-colors hover:text-white"
                    href={url}
                    key={id}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
