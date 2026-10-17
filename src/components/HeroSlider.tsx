"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { accessibleHeroTitle } from "./heroTitle";
import { nextWordIndex, WORD_BLUR_EM, WORD_CYCLE_MS } from "./rotatingWord";
import type { ScrollCueAction } from "./scrollCue";
import { getSmoothScroll } from "./SmoothScroll";
import { navigateWithBlackout } from "./page-transition/navigateWithBlackout";
import { ArrowRight } from "./ArrowRight";
import { AmbientYouTube } from "./AmbientYouTube";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export interface HeroSlide {
  id: string;
  video: { type: "file"; url: string } | { type: "youtube"; videoId: string };
  posterUrl: string | null;
  alt: string;
}

const SLIDE_INTERVAL_MS = 8000;

// One display line of the title: the word stack's every slot keys off this
// single height.
const TITLE_LINE_EM = 1.25;

/**
 * The Hero's video slider: every slide mounted at once (only the active one
 * plays), a fixed-interval auto-advance, and a crossfade between slides — the
 * incoming slide fades in above the outgoing one, so the blend never dips to
 * the black section behind them. The title and Scroll Cue overlay the video,
 * anchored to the section's bottom corners; the video stack counter-translates
 * against scroll so it stays visually still (the background-attachment: fixed
 * look) while the page scrolls over it and the next section slides up to
 * cover it. The videos and the track are display-only; the Scroll Cue is the
 * one interactive piece.
 */
export const HeroSlider = ({
  cue,
  leadInWord,
  rotatingWords,
  slides,
  title,
}: {
  cue: ScrollCueAction;
  leadInWord: string;
  rotatingWords: string[];
  slides: HeroSlide[];
  title: string;
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const sectionRef = useRef<HTMLElement>(null);
  const videoStackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    if (rotatingWords.length <= 1) return;
    const timer = window.setInterval(() => {
      setWordIndex((current) => nextWordIndex(current, rotatingWords.length));
    }, WORD_CYCLE_MS);
    return () => window.clearInterval(timer);
  }, [rotatingWords.length]);

  // Only the active slide plays; the rest sit paused on their poster frame.
  // Live Preview can shrink the slide list under the current index, so clamp.
  const safeActiveIndex = Math.min(activeIndex, slides.length - 1);
  // Same clamp for the word list, for the same Live Preview reason.
  const safeWordIndex =
    rotatingWords.length > 0
      ? Math.min(wordIndex, rotatingWords.length - 1)
      : 0;

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      // React sets `muted` as a property, not an attribute — some autoplay
      // policies check the attribute, so set the property here before play().
      video.muted = true;
      if (index === safeActiveIndex) {
        void video.play().catch(() => {
          // Autoplay refused (battery saver, cold start) — the poster
          // frame stays put, nothing to recover.
        });
      } else {
        video.pause();
      }
    });
  }, [safeActiveIndex, slides]);

  // The pure-fixed parallax: yPercent travels the stack's own height (it
  // fills the section, so that equals one viewport) across exactly the
  // scroll distance the section itself travels — the videos hold still on
  // screen while the section's box, the overlays, and the page scroll on.
  useGSAP(
    () => {
      const stack = videoStackRef.current;
      if (!stack) return;
      gsap.fromTo(
        stack,
        { yPercent: 0 },
        {
          yPercent: 100,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    },
    {
      scope: sectionRef,
      revertOnUpdate: true,
    },
  );

  // The cue's scroll branch: whatever follows the Hero — Who We Are, the
  // Client Marquee, or Selected Works, whichever the page is showing. Lenis
  // owns public-site scroll (ADR 0004), so it drives the travel. The native
  // fallback (a missing instance) smooths on its own.
  const scrollBelowHero = () => {
    const below = sectionRef.current?.nextElementSibling;
    if (!(below instanceof HTMLElement)) return;
    const smooth = getSmoothScroll();
    if (smooth) smooth.scrollTo(below);
    else below.scrollIntoView({ behavior: "smooth" });
  };

  const scrollCueClassName =
    "hidden lg:inline-flex items-center justify-center gap-2 transition-colors px-6 py-4 rounded-[4px] text-base bg-white text-black border border-white hover:bg-neutral-100 hover:text-primary-500 whitespace-nowrap";

  return (
    <section
      aria-label="Featured videos"
      className="relative h-svh w-full overflow-hidden bg-neutral-950"
      data-hero
      ref={sectionRef}
    >
      <div className="absolute inset-0" ref={videoStackRef}>
        {slides.map((slide, index) => (
          <div
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === safeActiveIndex ? "z-10 opacity-100" : "z-0 opacity-0"
            }`}
            key={slide.id || index}
          >
            {slide.video.type === "youtube" ? (
              /* An Embedded Video manages its own poster and fade-in — the
                 slider only tells it which slide is playing. */
              <AmbientYouTube
                alt={slide.alt}
                frameClassName="h-full w-full"
                height={9}
                playing={index === safeActiveIndex}
                poster={slide.posterUrl}
                videoId={slide.video.videoId}
                width={16}
              />
            ) : (
              <video
                aria-label={slide.alt}
                className="pointer-events-none h-full w-full object-cover"
                controlsList="nodownload"
                disablePictureInPicture
                loop
                muted
                playsInline
                poster={slide.posterUrl ?? undefined}
                preload={index === 0 ? "auto" : "none"}
                ref={(element) => {
                  videoRefs.current[index] = element;
                }}
                src={slide.video.url}
              />
            )}
          </div>
        ))}
      </div>

      {/* Difference Text (ADR 0006): the title and scroll cue button are
          rendered together in a bottom flex bar with difference blending.
          The gap prevents title/button collision on narrow desktop viewports,
          allowing the title text to naturally wrap/flex downwards. */}
      <div className="absolute inset-x-6 bottom-6 z-20 flex flex-row items-end justify-between gap-8 md:inset-x-16 md:bottom-12 md:gap-12 mix-blend-difference pointer-events-none">
        <div className="min-w-0 flex-1 pointer-events-auto">
          {/* The visible lines are aria-hidden — the word swap would otherwise
              re-announce every few seconds — so a static sr-only twin carries
              the full title to assistive tech and crawlers. */}
          <h1
            className="text-[36px] lg:text-[52px] xl:text-6xl leading-[1.25] tracking-tight text-white"
            data-fluid-title
            style={{ ["--title-line" as string]: `${TITLE_LINE_EM}em` }}
          >
            <span aria-hidden="true">
              {title}
              {rotatingWords.length > 0 && (
                <>
                  <br />
                  {leadInWord}{" "}
                  {/* The softblur crossfade: every word stacked in one grid
                      cell, the outgoing and incoming both fading while
                      blurring to --word-blur on the shared swipe easing
                      (duration-500 mirrors WORD_TRANSITION_MS). The stack's
                      width holds the widest word, so the line never reflows
                      mid-cycle. */}
                  <span
                    className="inline-grid h-(--title-line) align-bottom"
                    style={{ ["--word-blur" as string]: `${WORD_BLUR_EM}em` }}
                  >
                    {rotatingWords.map((word, index) => (
                      <span
                        className={`col-start-1 row-start-1 block h-(--title-line) text-secondary-500 transition-[opacity,filter] duration-500 ease-swipe ${
                          index === safeWordIndex
                            ? "opacity-100 [filter:blur(0px)]"
                            : "opacity-0 [filter:blur(var(--word-blur))]"
                        }`}
                        key={`${word}-${index}`}
                      >
                        {word}
                      </span>
                    ))}
                  </span>
                </>
              )}
            </span>
            <span className="sr-only">
              {accessibleHeroTitle(title, rotatingWords, leadInWord)}
            </span>
          </h1>
        </div>

        <div className="shrink-0 pointer-events-auto">
          {cue.kind === "link" ? (
            <Link
              className={scrollCueClassName}
              href={cue.url}
              onNavigate={(event) => navigateWithBlackout(event, cue.url)}
            >
              {cue.label} <ArrowRight />
            </Link>
          ) : (
            cue.kind === "scroll" && (
              <button
                className={scrollCueClassName}
                onClick={scrollBelowHero}
                type="button"
              >
                {cue.label} <ArrowRight />
              </button>
            )
          )}
        </div>
      </div>
    </section>
  );
};
