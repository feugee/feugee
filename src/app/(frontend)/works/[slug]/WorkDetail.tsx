"use client";

import Image from "next/image";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import type { Work } from "@/payload-types";

import { ArrowRight } from "@/components/ArrowRight";
import { AutoVideo } from "@/components/AutoVideo";
import { ScrollProgress } from "@/components/ScrollProgress";
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
    <div className="mx-auto grid w-full lg:grid-cols-[360px_1fr]">
      <ScrollProgress />
      {/* The lg+ sticky top already seats the aside clear of the overlaid
          navbar (sticky pushes down to its offset); below lg it is static
          above the single column, so the padding supplies that clearance
          there instead. */}
      <aside className="self-start px-6 md:px-12 lg:pb-16 max-lg:pt-32 lg:sticky lg:top-32">
        <nav aria-label="Work sections" className="lg:space-y-12">
          <div className="w-full pb-12 border-b border-neutral-900 space-y-6">
            <h1 className="text-neutral-50 text-4xl font-bold block">
              {data.title}
            </h1>
            <p className="text-neutral-500 text-lg block">{data.subtitle}</p>
          </div>
          <div className="space-y-6 hidden lg:block">
            {/* inline keeps the span-era layout: space-y-6's margin-bottom is
                ignored on inline boxes, so the ul's mt-4 still sets the gap. */}
            <h2 className="inline text-lg text-white">Contents</h2>
            <ul className="mt-4 space-y-2">
              {sections.map((section, index) => {
                const anchor = sectionAnchor(index);
                const active = activeSection === anchor;
                return (
                  <li key={section.id ?? index}>
                    <a
                      aria-current={active ? "true" : undefined}
                      className={`flex items-center gap-2 text-xl transition-colors ${
                        active ? "text-primary-500" : "text-neutral-800"
                      }`}
                      href={`#${anchor}`}
                    >
                      {/* Reserved slot keeps labels steady as the arrow toggles. */}
                      <span className="inline-flex w-5 shrink-0 justify-center">
                        {active ? <ArrowRight /> : null}
                      </span>
                      {section.title}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </aside>

      <div className="w-full">
        <section
          id="work-detail"
          className="scroll-mt-[calc(var(--navbar-height)+0.5rem)] "
        >
          {heroThumbnail && (
            <div className="relative w-full h-screen">
              {heroThumbnail.kind === "video" ? (
                <AutoVideo
                  alt={heroThumbnail.alt}
                  className="absolute inset-0 h-full w-full object-cover"
                  height={heroThumbnail.height}
                  poster={heroThumbnail.posterUrl}
                  src={heroThumbnail.url}
                  width={heroThumbnail.width}
                />
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

          <div className="p-8 flex flex-col gap-y-8">
            <div className="w-full flex flex-row justify-start items-stretch gap-x-8">
              {data.client && <Meta label="Client" value={data.client} />}
              {sectorName && (
                <>
                  <div className="w-px bg-neutral-900"></div>
                  <Meta label="Sector" value={sectorName} />
                </>
              )}
              {data.associate && (
                <>
                  <div className="w-px bg-neutral-900"></div>
                  <Meta label="Associate" value={data.associate} />
                </>
              )}
            </div>
            <div className="w-full h-px bg-neutral-900"></div>
            <div className="w-full flex flex-row justify-start items-stretch gap-x-8">
              {data.projectTeam?.length ? (
                <MetaList label="Project Team" values={data.projectTeam} />
              ) : null}
              {data.expertise?.length ? (
                <>
                  <div className="w-px bg-neutral-900"></div>
                  <MetaList label="Expertise" values={data.expertise} />
                </>
              ) : null}
              {data.collaborators?.length ? (
                <>
                  <div className="w-px bg-neutral-900"></div>
                  <MetaList label="Collaborators" values={data.collaborators} />
                </>
              ) : null}
              {data.year != null ? (
                <>
                  <div className="w-px bg-neutral-900"></div>
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
            className="scroll-mt-[calc(var(--navbar-height)+0.5rem)] space-y-8 p-16"
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
                    <div className="text-md text-primary-500">
                      {testimonial.name}
                    </div>
                    <div className="text-xs text-neutral-300">
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
