"use client";

import Image from "next/image";
import Link from "next/link";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import type { Work } from "@/payload-types";

import { ArrowPush } from "@/components/ArrowPush";
import { AutoVideo } from "@/components/AutoVideo";
import { AmbientYouTube } from "@/components/AmbientYouTube";
import { ScrollProgress } from "@/components/ScrollProgress";
import { navigateWithBlackout } from "@/components/page-transition/navigateWithBlackout";
import { workThumbnailOf } from "@/components/work";
import { WorkSections, sectionAnchor } from "./WorkSections";

// Meta blocks are label/value pairs — description lists fit them exactly.
const Meta = ({ label, value }: { label: string; value: ReactNode }) => (
  <dl className="space-y-3 w-full">
    <dt className="text-xl text-neutral-600">{label}</dt>
    <dd className="text-xl text-white">{value}</dd>
  </dl>
);

const MetaList = ({ label, values }: { label: string; values: string[] }) => (
  <dl className="w-full space-y-3">
    <dt className="text-xl text-neutral-600">{label}</dt>
    <dd>
      <ul className="space-y-1">
        {values.map((value) => (
          <li key={value} className="text-xl text-white">
            {value}
          </li>
        ))}
      </ul>
    </dd>
  </dl>
);

// The Contents list body shared by the desktop sidebar and the mobile
// accordion — the scroll-spy highlight reads the same in both.
const ContentsLinks = ({
  activeSection,
  sections,
}: {
  activeSection: string | null;
  sections: NonNullable<Work["sections"]>;
}) => (
  <ul className="mt-4 space-y-4">
    {sections.map((section, index) => {
      const anchor = sectionAnchor(index);
      const active = activeSection === anchor;
      return (
        <li key={section.id ?? index}>
          <Link
            aria-current={active ? "true" : undefined}
            className={`group flex items-center text-xl transition-colors ${
              active
                ? "text-primary-500"
                : "text-neutral-800 hover:text-white focus-visible:text-white"
            }`}
            href={`#${anchor}`}
          >
            <ArrowPush active={active} hover="slide" />
            {section.title}
          </Link>
        </li>
      );
    })}
  </ul>
);

// Below lg the Contents folds into an accordion: closed on load, the trigger
// a full-width row whose chevron turns over when open. The list keeps the
// desktop scroll-spy highlight, and stays open across section jumps.
const ContentsAccordion = ({
  activeSection,
  sections,
}: {
  activeSection: string | null;
  sections: NonNullable<Work["sections"]>;
}) => {
  const [open, setOpen] = useState(false);
  if (!sections.length) return null;
  return (
    <div className="mt-6 pb-6 lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        className="flex w-full items-center justify-between py-2 text-left text-lg text-white"
        onClick={() => setOpen((value) => !value)}
      >
        Contents
        <span
          aria-hidden="true"
          className={`text-primary-500 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        >
          <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
            <path
              d="M3 6l5 5 5-5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        </span>
      </button>
      {open && (
        <ContentsLinks activeSection={activeSection} sections={sections} />
      )}
    </div>
  );
};

// Pure view of one Work. The public Detail Page renders it statically from
// the published doc; the preview route hands it the Live Preview stream.
export const WorkDetail = ({ data }: { data: Work }) => {
  const sections = useMemo(() => data.sections ?? [], [data.sections]);
  const sectorName =
    typeof data.sector === "object" && data.sector !== null
      ? data.sector.name
      : null;
  // The hero is a direct thumbnail consumer — the work module owns the
  // video/poster discrimination and the poster-derived dimensions. It is
  // full-bleed (100vw × 100svh), so it requests the wide variant.
  const heroThumbnail = workThumbnailOf(data, "wide");

  // Scroll-spy for the Contents nav: the section crossing a band near the top
  // of the viewport is the current one.
  const [activeSection, setActiveSection] = useState<string | null>(
    sectionAnchor(0),
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-10% 0px -75% 0px" },
    );

    for (const index of sections.keys()) {
      const element = document.getElementById(sectionAnchor(index));
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="mx-auto grid w-full lg:grid-cols-[minmax(0,min(25%,500px))_1fr]">
      <ScrollProgress />
      {/* The lg+ sticky top already seats the aside clear of the overlaid
          navbar (sticky pushes down to its offset); below lg it is static
          above the single column, so the padding supplies that clearance
          there instead. */}
      <aside className="self-start px-6 md:px-12 lg:pb-16 max-lg:pt-32 lg:sticky lg:top-32">
        <nav aria-label="Work sections" className="lg:space-y-12">
          <Link
            className="hidden lg:inline-flex items-center gap-3 hover:text-primary-500 transition px-4 py-2 rounded-sm border-neutral-800 border text-white"
            href="/works"
            onNavigate={(event) => navigateWithBlackout(event, "/works")}
          >
            <span aria-hidden="true" className="">
              &lt;
            </span>
            Back
          </Link>
          <div className="w-full pb-12 border-b border-neutral-900 space-y-4">
            <h1 className="text-neutral-50 text-4xl font-bold block">
              {data.title}
            </h1>
            <p className="text-neutral-500 text-xl block">{data.subtitle}</p>
          </div>
          <div className="space-y-6 hidden lg:block">
            {/* inline keeps the span-era layout: space-y-6's margin-bottom is
                ignored on inline boxes, so the ul's mt-4 still sets the gap. */}
            <h2 className="inline text-lg text-white">Contents</h2>
            <ContentsLinks activeSection={activeSection} sections={sections} />
          </div>
          <ContentsAccordion activeSection={activeSection} sections={sections} />
        </nav>
      </aside>

      <div className="w-full">
        <section
          id="work-detail"
          className="scroll-mt-[calc(var(--navbar-height)+0.5rem)] "
        >
          {heroThumbnail && (
            <div className="relative w-full h-svh rounded-md overflow-hidden">
              {heroThumbnail.kind === "video" ? (
                heroThumbnail.source.type === "youtube" ? (
                  <AmbientYouTube
                    alt={heroThumbnail.alt}
                    frameClassName="absolute inset-0 h-full w-full"
                    height={heroThumbnail.height}
                    poster={heroThumbnail.posterUrl}
                    videoId={heroThumbnail.source.videoId}
                    width={heroThumbnail.width}
                  />
                ) : (
                  <AutoVideo
                    alt={heroThumbnail.alt}
                    className="absolute inset-0 h-full w-full object-cover"
                    height={heroThumbnail.height}
                    poster={heroThumbnail.posterUrl}
                    src={heroThumbnail.source.url}
                    width={heroThumbnail.width}
                  />
                )
              ) : (
                /* A sized Payload variant — the optimizer would only
                   re-encode it. */
                <Image
                  src={heroThumbnail.url}
                  alt={heroThumbnail.alt}
                  fill
                  className="object-cover"
                />
              )}
            </div>
          )}

          <div className="p-6 lg:p-8 flex flex-col gap-y-8">
            <div className="w-full flex flex-col justify-start items-stretch gap-y-8 lg:flex-row lg:gap-x-8">
              {data.client && <Meta label="Client" value={data.client} />}
              {sectorName && (
                <>
                  <div className="hidden w-px bg-neutral-900 lg:block"></div>
                  <Meta label="Sector" value={sectorName} />
                </>
              )}
              {data.associate && (
                <>
                  <div className="hidden w-px bg-neutral-900 lg:block"></div>
                  <Meta label="Associate" value={data.associate} />
                </>
              )}
            </div>
            <div className="w-full h-px bg-neutral-900"></div>
            <div className="w-full flex flex-col justify-start items-stretch gap-y-8 lg:flex-row lg:gap-x-8">
              {data.projectTeam?.length ? (
                <MetaList label="Project Team" values={data.projectTeam} />
              ) : null}
              {data.expertise?.length ? (
                <>
                  <div className="hidden w-px bg-neutral-900 lg:block"></div>
                  <MetaList label="Expertise" values={data.expertise} />
                </>
              ) : null}
              {data.collaborators?.length ? (
                <>
                  <div className="hidden w-px bg-neutral-900 lg:block"></div>
                  <MetaList label="Collaborators" values={data.collaborators} />
                </>
              ) : null}
              {data.year != null ? (
                <>
                  <div className="hidden w-px bg-neutral-900 lg:block"></div>
                  <Meta label="Year" value={data.year} />
                </>
              ) : null}
            </div>
            {data.description ? (
              <div className="w-full flex flex-row justify-start mb-8">
                <dl className="w-full space-y-3">
                  {data.descriptionLabel ? (
                    <dt className="text-xl text-neutral-600">
                      {data.descriptionLabel}
                    </dt>
                  ) : null}
                  <dd>
                    <RichText
                      className="text-2xl text-white [&_blockquote]:border-l-2 [&_blockquote]:border-primary-500 [&_blockquote]:pl-4 [&_blockquote]:font-bold"
                      data={data.description}
                    />
                  </dd>
                </dl>
              </div>
            ) : null}
          </div>
        </section>

        <WorkSections sections={sections} />

        {data.testimonials?.length ? (
          <section
            id="testimonials"
            className="scroll-mt-[calc(var(--navbar-height)+0.5rem)] space-y-8 p-8 lg:p-16"
          >
            <div className="space-y-8">
              {(data.testimonials ?? []).map((testimonial, index) => (
                <figure key={testimonial.id ?? index} className="space-y-8">
                  <blockquote className="text-2xl text-white">
                    &quot;{testimonial.testimony}&quot;
                  </blockquote>
                  {/* One figcaption per figure; the two lines keep their own
                      classes inside it. */}
                  <figcaption className="space-y-1.5">
                    <div className="text-xl text-primary-500">
                      {testimonial.name}
                    </div>
                    <div className="text-base text-neutral-300">
                      {testimonial.job}
                      {testimonial.company && `, ${testimonial.company}`}
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
};
