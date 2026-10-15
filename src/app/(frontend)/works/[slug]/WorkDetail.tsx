"use client";

import Image from "next/image";
import Link from "next/link";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { Work } from "@/payload-types";

import { AutoVideo } from "@/components/AutoVideo";
import { badgeOf } from "@/components/work";
import { InteractiveYouTube } from "@/components/InteractiveYouTube";
import { ScrollProgress } from "@/components/ScrollProgress";
import { navigateWithBlackout } from "@/components/page-transition/navigateWithBlackout";
import { workThumbnailOf } from "@/components/work";
import { QuoteIcon } from "@/components/QuoteIcon";
import { ArrowPush } from "@/components/ArrowPush";
import { getSmoothScroll } from "@/components/SmoothScroll";
import { ContentsLinks, ContentsNav } from "./ContentsNav";
import { WorkSections, sectionAnchor } from "./WorkSections";

// Meta blocks are label/value pairs — description lists fit them exactly.
const Meta = ({
  label,
  value,
  variant = "feugee",
}: {
  label: string;
  value: ReactNode;
  variant?: "feugee" | "koto" | "hybrid";
}) => {
  if (variant === "koto") {
    return (
      <dl className="space-y-1.5 w-full">
        <dt className="text-[11px] font-mono uppercase text-neutral-500">
          {label}
        </dt>
        <dd className="text-sm font-normal text-neutral-200">{value}</dd>
      </dl>
    );
  }

  if (variant === "hybrid") {
    return (
      <dl className="space-y-1.5 w-full">
        <dt className="text-xs font-sans uppercase text-neutral-500 font-medium">
          {label}
        </dt>
        <dd className="text-sm lg:text-base font-sans font-normal text-neutral-200">{value}</dd>
      </dl>
    );
  }

  return (
    <dl className="space-y-3 w-full">
      <dt className="text-sm md:text-base lg:text-xl text-neutral-600">{label}</dt>
      <dd className="text-base md:text-lg lg:text-xl text-white">{value}</dd>
    </dl>
  );
};

const MetaList = ({
  label,
  values,
  variant = "feugee",
}: {
  label: string;
  values: string[];
  variant?: "feugee" | "koto" | "hybrid";
}) => {
  if (variant === "koto") {
    return (
      <dl className="w-full space-y-1.5">
        <dt className="text-[11px] font-mono uppercase text-neutral-500">
          {label}
        </dt>
        <dd>
          <ul className="space-y-0.5">
            {values.map((value) => (
              <li key={value} className="text-sm font-normal text-neutral-200">
                {value}
              </li>
            ))}
          </ul>
        </dd>
      </dl>
    );
  }

  if (variant === "hybrid") {
    return (
      <dl className="w-full space-y-1.5">
        <dt className="text-xs font-sans uppercase text-neutral-500 font-medium">
          {label}
        </dt>
        <dd>
          <ul className="space-y-0.5">
            {values.map((value) => (
              <li key={value} className="text-sm lg:text-base font-sans font-normal text-neutral-200">
                {value}
              </li>
            ))}
          </ul>
        </dd>
      </dl>
    );
  }

  return (
    <dl className="w-full space-y-3">
      <dt className="text-sm md:text-base lg:text-xl text-neutral-600">{label}</dt>
      <dd>
        <ul className="space-y-1">
          {values.map((value) => (
            <li key={value} className="text-base md:text-lg lg:text-xl text-white">
              {value}
            </li>
          ))}
        </ul>
      </dd>
    </dl>
  );
};

function WorkDetailContent({ data }: { data: Work }) {
  const searchParams = useSearchParams();
  const rawVariant = searchParams.get("variant")?.toLowerCase();
  // Layout is permanently Variant C (Hybrid) by default per Hajun's decision
  const variant: "feugee" | "koto" | "hybrid" =
    rawVariant === "koto" ? "koto" : rawVariant === "feugee" ? "feugee" : "hybrid";

  const sections = useMemo(() => data.sections ?? [], [data.sections]);
  const badge = badgeOf(data.badge);
  const sectorName =
    typeof data.sector === "object" && data.sector !== null
      ? data.sector.name
      : null;
  const heroThumbnail = workThumbnailOf(data, "wide");
  const heroRef = useRef<HTMLDivElement>(null);

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

  // Smooth scroll handler following Koto formula
  const handleAnchorScroll = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, anchor: string) => {
      event.preventDefault();
      event.stopPropagation();

      const target = document.getElementById(anchor);
      if (!target) return;

      const currentScroll = window.scrollY;
      const targetTop = target.getBoundingClientRect().top + currentScroll;
      const distance = Math.abs(currentScroll - targetTop);

      const duration = Math.max(1.2, Math.min(2.8, distance / 800));
      const power2InOut = (t: number) =>
        t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const smooth = getSmoothScroll();
      if (smooth) {
        smooth.start();
        smooth.scrollTo(target, {
          duration,
          easing: power2InOut,
          lock: true,
        });
      } else {
        target.scrollIntoView({ behavior: "smooth" });
      }

      window.history.pushState(null, "", `#${anchor}`);
    },
    [],
  );

  // Outer wrapper styles per variant
  const containerClass =
    variant === "koto"
      ? "mx-auto min-h-screen flex flex-col lg:flex-row w-full max-w-[1728px] px-4 md:px-8 lg:px-12 gap-x-8 xl:gap-x-12"
      : variant === "hybrid"
        ? "min-h-screen flex flex-col lg:flex-row w-full pl-0 lg:pl-12 pr-0 gap-x-8 lg:gap-x-12"
        : "mx-auto grid w-full lg:grid-cols-[minmax(0,min(25%,500px))_1fr]";

  // Sidebar container styles per variant
  const asideClass =
    variant === "koto"
      ? "self-start w-full lg:w-[20rem] lg:shrink-0 max-lg:pt-32 lg:sticky lg:top-28 lg:pt-4"
      : variant === "hybrid"
        ? "self-start w-full lg:w-[20rem] lg:shrink-0 px-6 md:px-12 lg:px-0 max-lg:pt-32 lg:sticky lg:top-28 lg:pt-4"
        : "self-start px-6 md:px-12 lg:pb-16 max-lg:pt-32 lg:sticky lg:top-32";

  return (
    <>
      <div className={containerClass}>
        <ScrollProgress />

        <aside className={asideClass}>
          {variant === "koto" ? (
            /* ==========================================================
               VARIANT B: PURE KOTO SIDEBAR (320px, 16px nav, active dots)
               ========================================================== */
            <nav aria-label="Work sections" className="space-y-6">
              <Link
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 text-xs transition-colors"
                href="/works"
                onNavigate={(event) => navigateWithBlackout(event, "/works")}
              >
                <span aria-hidden="true">&lt;</span>
                Back
              </Link>

              <div className="w-full border-b border-neutral-900/80 pb-6">
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase text-neutral-500 mb-2.5">
                  <span>{sectorName ?? "PROJECT"}</span>
                  <span>•</span>
                  <span>{data.year ?? "2024"}</span>
                  {badge && (
                    <>
                      <span>•</span>
                      <span className="text-primary-500">{badge.name}</span>
                    </>
                  )}
                </div>

                <h1 className="text-xl md:text-2xl font-light tracking-tight text-white mb-1.5">
                  {data.title}
                </h1>
                <p className="text-sm md:text-base text-neutral-400 font-light leading-relaxed">
                  {data.subtitle}
                </p>
              </div>

              <div className="hidden lg:block space-y-3">
                <h2 className="text-[11px] font-mono uppercase text-neutral-500">
                  Contents
                </h2>
                <ul className="space-y-2">
                  {sections.map((section, index) => {
                    const anchor = sectionAnchor(index);
                    const active = activeSection === anchor;
                    return (
                      <li key={section.id ?? index}>
                        <a
                          aria-current={active ? "true" : undefined}
                          className={`group flex items-center text-sm transition-colors py-0.5 ${
                            active
                              ? "text-white font-medium"
                              : "text-neutral-500 hover:text-neutral-300 font-normal"
                          }`}
                          href={`#${anchor}`}
                          onClick={(event) => handleAnchorScroll(event, anchor)}
                        >
                          <span
                            className={`inline-block size-1.5 rounded-full mr-2.5 transition-all ${
                              active
                                ? "bg-white scale-100"
                                : "bg-neutral-700 scale-0 group-hover:scale-100"
                            }`}
                          />
                          {section.title}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <ContentsNav
                activeSection={activeSection}
                sections={sections}
              />
            </nav>
          ) : variant === "hybrid" ? (
            /* ==========================================================
               VARIANT C: CUSTOM KOTO STRUCTURE + FEUGEE ALBERT SANS FONT
               ========================================================== */
            <nav aria-label="Work sections" className="space-y-6">
              <Link
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-neutral-800 text-neutral-400 hover:text-primary-500 hover:border-primary-500/50 font-sans text-xs transition-colors"
                href="/works"
                onNavigate={(event) => navigateWithBlackout(event, "/works")}
              >
                <span aria-hidden="true">&lt;</span>
                Back
              </Link>

              <div className="w-full max-lg:border-b-0 border-b border-neutral-900/80 pb-6">
                <div className="flex items-center gap-1.5 text-xs font-sans uppercase text-neutral-500 mb-2.5">
                  <span>{sectorName ?? "PROJECT"}</span>
                  <span>•</span>
                  <span>{data.year ?? "2024"}</span>
                  {badge && (
                    <>
                      <span>•</span>
                      <span
                        className="font-medium"
                        style={{ color: badge.color }}
                      >
                        {badge.name}
                      </span>
                    </>
                  )}
                </div>

                <h1 className="text-xl md:text-2xl font-sans font-medium tracking-tight text-white mb-1.5">
                  {data.title}
                </h1>
                <p className="text-sm md:text-base font-sans text-neutral-400 font-normal leading-relaxed">
                  {data.subtitle}
                </p>
              </div>

              <div className="hidden lg:block space-y-3">
                <h2 className="text-xs font-sans uppercase text-neutral-500 font-medium">
                  Contents
                </h2>
                <ul className="space-y-2">
                  {sections.map((section, index) => {
                    const anchor = sectionAnchor(index);
                    const active = activeSection === anchor;
                    return (
                      <li key={section.id ?? index}>
                        <a
                          aria-current={active ? "true" : undefined}
                          className={`group flex items-center text-sm font-sans transition-colors py-0.5 ${
                            active
                              ? "text-primary-500 font-medium"
                              : "text-neutral-700 hover:text-white font-normal"
                          }`}
                          href={`#${anchor}`}
                          onClick={(event) => handleAnchorScroll(event, anchor)}
                        >
                          <ArrowPush active={active} hover={false} />
                          {section.title}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <ContentsNav
                activeSection={activeSection}
                sections={sections}
              />
            </nav>
          ) : (
            /* ==========================================================
               VARIANT A: FEUGEE BASELINE SIDEBAR
               ========================================================== */
            <nav aria-label="Work sections" className="lg:space-y-12">
              <Link
                className="hidden lg:inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[4px] border border-neutral-800 text-white hover:border-neutral-700 hover:text-primary-500 transition-colors text-base"
                href="/works"
                onNavigate={(event) => navigateWithBlackout(event, "/works")}
              >
                <span aria-hidden="true">&lt;</span>
                Back
              </Link>
              <div className="w-full pb-6 lg:pb-12 border-b border-neutral-900 lg:space-y-4">
                {badge && (
                  <div
                    className="inline-flex lg:hidden items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-medium w-fit mb-4"
                    style={{ backgroundColor: badge.color }}
                  >
                    <Image
                      alt={badge.name}
                      className="size-3.5 object-contain"
                      height={14}
                      src={badge.iconUrl}
                      unoptimized
                      width={14}
                    />
                    <span>{badge.name}</span>
                  </div>
                )}
                <h1 className="text-neutral-50 text-2xl md:text-3xl lg:text-4xl font-bold block mb-2 lg:mb-4">
                  {data.title}
                </h1>
                <p className="text-neutral-500 text-lg md:text-xl lg:text-xl block">
                  {data.subtitle}
                </p>
              </div>
              <div className="space-y-6 hidden lg:block">
                <h2 className="inline text-base text-white">Contents</h2>
                <ContentsLinks
                  activeSection={activeSection}
                  className="mt-4"
                  sections={sections}
                />
              </div>
              <ContentsNav
                activeSection={activeSection}
                sections={sections}
              />
            </nav>
          )}
        </aside>

        {/* ==========================================================
            MAIN CONTENT AREA
            ========================================================== */}
        <div className="w-full min-w-0 flex-1">
          <section
            id="work-detail"
            className="scroll-mt-[calc(var(--navbar-height)+0.5rem)]"
          >
            {heroThumbnail && (
              <div
                className={`relative w-full aspect-video ${
                  variant === "hybrid"
                    ? "max-lg:rounded-none rounded-md"
                    : "rounded-md"
                } overflow-hidden`}
                ref={heroRef}
              >
                {heroThumbnail.kind === "video" ? (
                  heroThumbnail.source.type === "youtube" ? (
                    <InteractiveYouTube
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
                  <Image
                    src={heroThumbnail.url}
                    alt={heroThumbnail.alt}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            )}

            <div
              className={
                variant === "koto"
                  ? "py-8 lg:py-10 flex flex-col gap-y-6"
                  : variant === "hybrid"
                    ? "py-8 lg:py-12 px-6 md:px-12 lg:pl-0 lg:pr-12 flex flex-col gap-y-8"
                    : "p-6 lg:p-8 flex flex-col gap-y-8"
              }
            >
              <div className="w-full grid grid-cols-2 lg:flex flex-col justify-start items-stretch gap-y-6 lg:flex-row lg:gap-x-8">
                {data.client && (
                  <Meta label="Client" value={data.client} variant={variant} />
                )}
                {sectorName && (
                  <>
                    <div className="hidden w-px bg-neutral-900 lg:block"></div>
                    <Meta label="Sector" value={sectorName} variant={variant} />
                  </>
                )}
                {data.associate && (
                  <>
                    <div className="hidden w-px bg-neutral-900 lg:block"></div>
                    <Meta label="Associate" value={data.associate} variant={variant} />
                  </>
                )}
              </div>
              <div className="w-full h-px bg-neutral-900"></div>
              <div className="w-full grid grid-cols-2 lg:flex flex-col justify-start items-stretch gap-y-6 lg:flex-row lg:gap-x-8">
                {data.projectTeam?.length ? (
                  <MetaList
                    label="Project Team"
                    values={data.projectTeam}
                    variant={variant}
                  />
                ) : null}
                {data.expertise?.length ? (
                  <>
                    <div className="hidden w-px bg-neutral-900 lg:block"></div>
                    <MetaList
                      label="Expertise"
                      values={data.expertise}
                      variant={variant}
                    />
                  </>
                ) : null}
                {data.collaborators?.length ? (
                  <>
                    <div className="hidden w-px bg-neutral-900 lg:block"></div>
                    <MetaList
                      label="Collaborators"
                      values={data.collaborators}
                      variant={variant}
                    />
                  </>
                ) : null}
                {data.year != null ? (
                  <>
                    <div className="hidden w-px bg-neutral-900 lg:block"></div>
                    <Meta label="Year" value={data.year} variant={variant} />
                  </>
                ) : null}
              </div>

              {data.description ? (
                <div className="w-full flex flex-row justify-start mb-6">
                  <dl className="w-full space-y-2">
                    {data.descriptionLabel ? (
                      <dt
                        className={
                          variant === "koto"
                            ? "text-[11px] font-mono uppercase text-neutral-500"
                            : variant === "hybrid"
                              ? "text-xs font-sans font-medium uppercase text-neutral-500"
                              : "text-sm md:text-base lg:text-xl text-neutral-600"
                        }
                      >
                        {data.descriptionLabel}
                      </dt>
                    ) : null}
                    <dd>
                      <RichText
                        className={
                          variant === "koto"
                            ? "text-base md:text-lg lg:text-xl font-light leading-relaxed text-neutral-300 [&_blockquote]:border-l-2 [&_blockquote]:border-neutral-500 [&_blockquote]:pl-4 [&_blockquote]:font-normal"
                            : variant === "hybrid"
                              ? "text-lg lg:text-xl font-sans font-normal leading-relaxed text-neutral-200 [&_blockquote]:border-l-2 [&_blockquote]:border-primary-500 [&_blockquote]:pl-4 [&_blockquote]:font-medium"
                              : "text-base md:text-lg lg:text-2xl text-white [&_blockquote]:border-l-2 [&_blockquote]:border-primary-500 [&_blockquote]:pl-4 [&_blockquote]:font-bold"
                        }
                        data={data.description}
                      />
                    </dd>
                  </dl>
                </div>
              ) : null}
            </div>
          </section>

          <WorkSections sections={sections} variant={variant} />

          {data.testimonials?.length ? (
            <section
              id="testimonials"
              className={
                variant === "feugee"
                  ? "scroll-mt-[calc(var(--navbar-height)+0.5rem)] py-32 px-8 lg:px-16 flex flex-col items-center justify-center text-center"
                  : "scroll-mt-[calc(var(--navbar-height)+0.5rem)] py-20 lg:py-24 px-8 lg:px-16 flex flex-col items-center justify-center text-center"
              }
            >
              <div className="w-full max-w-3xl space-y-8 flex flex-col items-center justify-center text-center">
                {(data.testimonials ?? []).map((testimonial, index) => (
                  <figure
                    key={testimonial.id ?? index}
                    className="space-y-8 flex flex-col items-center justify-center text-center"
                  >
                    <QuoteIcon className="h-10 w-10 text-neutral-800" />
                    <blockquote
                      className={
                        variant === "koto"
                          ? "text-lg md:text-xl lg:text-2xl font-light text-neutral-200"
                          : variant === "hybrid"
                            ? "text-xl lg:text-2xl font-normal text-white"
                            : "text-xl md:text-2xl lg:text-3xl text-white"
                      }
                    >
                      &quot;{testimonial.testimony}&quot;
                    </blockquote>
                    <figcaption className="space-y-1.5 flex flex-col items-center justify-center text-center">
                      <div className="text-base lg:text-lg text-primary-500 font-medium">
                        {testimonial.name}
                      </div>
                      <div className="text-sm lg:text-base text-neutral-400 font-normal">
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

        {badge && variant === "feugee" && (
          <span
            className="pointer-events-none fixed right-0 top-32 hidden lg:flex h-10 items-center pl-6 pr-3 text-base text-white [clip-path:polygon(0_0,100%_0,100%_100%,0_100%,12px_50%)]"
            style={{ backgroundColor: badge.color }}
          >
            <Image
              alt={badge.name}
              className="size-5 lg:size-6 object-contain"
              height={24}
              src={badge.iconUrl}
              unoptimized
              width={24}
            />
            <span aria-hidden="true" className="grid max-w-48 grid-cols-[minmax(0,1fr)]">
              <span className="min-w-0 overflow-hidden pl-3 whitespace-nowrap text-xs lg:text-base">
                {badge.name}
              </span>
            </span>
          </span>
        )}
      </div>
    </>
  );
}

export const WorkDetail = ({ data }: { data: Work }) => {
  return (
    <Suspense fallback={null}>
      <WorkDetailContent data={data} />
    </Suspense>
  );
};
