"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { accessibleHeroTitle } from "./heroTitle";
import { nextWordIndex, WORD_BLUR_PX, WORD_CYCLE_MS } from "./rotatingWord";
import type { ScrollCueAction } from "./scrollCue";
import { getSmoothScroll } from "./SmoothScroll";
import { navigateWithBlackout } from "./page-transition/navigateWithBlackout";
import { ArrowRight } from "./ArrowRight";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export interface HeroSlide {
  id: string;
  url: string;
  posterUrl: string | null;
  alt: string;
}

const SLIDE_INTERVAL_MS = 8000;
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

// One display line of the title: the word stack's every slot keys off this
// single height.
const TITLE_LINE_EM = 1.15;

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
  const [reducedMotion, setReducedMotion] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const sectionRef = useRef<HTMLElement>(null);
  const videoStackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia(reducedMotionQuery);
    const sync = () => setReducedMotion(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reducedMotion || slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [reducedMotion, slides.length]);

  useEffect(() => {
    if (reducedMotion || rotatingWords.length <= 1) return;
    const timer = window.setInterval(() => {
      setWordIndex((current) => nextWordIndex(current, rotatingWords.length));
    }, WORD_CYCLE_MS);
    return () => window.clearInterval(timer);
  }, [reducedMotion, rotatingWords.length]);

  // Only the active slide plays; the rest sit paused on their poster frame.
  // Live Preview can shrink the slide list under the current index, so clamp.
  const safeActiveIndex = Math.min(activeIndex, slides.length - 1);
  // Same clamp for the word list, for the same Live Preview reason. Reduced
  // motion pins the first word — the static "Into Motion" state — even when
  // toggled on mid-cycle; the dropped transition class makes it snap.
  const safeWordIndex =
    rotatingWords.length > 0
      ? reducedMotion
        ? 0
        : Math.min(wordIndex, rotatingWords.length - 1)
      : 0;

  useEffect(() => {
    if (reducedMotion) return;
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
  }, [reducedMotion, safeActiveIndex, slides]);

  // The pure-fixed parallax: yPercent travels the stack's own height (it
  // fills the section, so that equals one viewport) across exactly the
  // scroll distance the section itself travels — the videos hold still on
  // screen while the section's box, the overlays, and the page scroll on.
  useGSAP(
    () => {
      if (reducedMotion) return;
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
      dependencies: [reducedMotion],
      revertOnUpdate: true,
    },
  );

  // The cue's scroll branch: whatever follows the Hero — Who We Are, the
  // Client Marquee, or Selected Works, whichever the page is showing. Lenis
  // owns public-site scroll (ADR 0004), so it drives the travel — and
  // honors reduced motion by jumping instantly. The native fallback (a
  // missing instance) has to gate the smooth behavior itself.
  const scrollBelowHero = () => {
    const below = sectionRef.current?.nextElementSibling;
    if (!(below instanceof HTMLElement)) return;
    const smooth = getSmoothScroll();
    if (smooth) smooth.scrollTo(below);
    else
      below.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
      });
  };

  // Difference blending (ADR 0006) for the cue extends from text to a filled
  // control: the white pill inverts the video behind it while the black label
  // rides as the un-blended video (difference with black is identity). The
  // blend and the pulse share the element — a wrapper's animated opacity
  // would wall the blend off from the video.
  const scrollCueClassName = `absolute flex justify-center items-center gap-x-[8px] bottom-6 right-6 z-20 rounded-[4px] bg-white px-6 py-4 text-base font-medium tracking-wide text-black hover:text-primary-500 transtition- mix-blend-difference md:bottom-12 md:right-16 ${
    reducedMotion ? "" : "animate-cue-pulse"
  }`;

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
            <video
              aria-label={slide.alt}
              className="pointer-events-none h-full w-full object-cover"
              loop
              muted
              playsInline
              poster={slide.posterUrl ?? undefined}
              preload={index === 0 ? "auto" : "none"}
              ref={(element) => {
                videoRefs.current[index] = element;
              }}
              src={slide.url}
            />
          </div>
        ))}
      </div>

      {/* Difference Text (ADR 0006): the title and dashes are white with
          difference blending, so they read as the negative of the video. The
          blend sits on this container — a plain child of the section, so its
          backdrop is the video stack. */}
      <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-4 mix-blend-difference md:bottom-12 md:left-16 md:gap-6">
        {/* The visible lines are aria-hidden — the word swap would otherwise
            re-announce every few seconds — so a static sr-only twin carries
            the full title to assistive tech and crawlers. */}
        <h1
          className="text-7xl leading-[1.15] tracking-tight text-white"
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
                    mid-cycle. The transition is dropped under reduced
                    motion so the reset to the first word snaps. */}
                <span
                  className="inline-grid h-(--title-line) align-bottom"
                  style={{ ["--word-blur" as string]: `${WORD_BLUR_PX}px` }}
                >
                  {rotatingWords.map((word, index) => (
                    <span
                      className={`col-start-1 row-start-1 block h-(--title-line) text-secondary-500 ${
                        index === safeWordIndex
                          ? "opacity-100 [filter:blur(0px)]"
                          : "opacity-0 [filter:blur(var(--word-blur))]"
                      } ${
                        reducedMotion
                          ? ""
                          : "transition-[opacity,filter] duration-500 ease-swipe"
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

        {slides.length > 1 && (
          <div aria-hidden className="flex items-center gap-2">
            {slides.map((slide, index) => (
              <div
                className={
                  index === safeActiveIndex
                    ? "h-0.75 w-8 bg-white md:w-16"
                    : "h-0.75 w-6 bg-white/50"
                }
                key={slide.id || index}
              />
            ))}
          </div>
        )}
      </div>

      {cue.kind === "link" ? (
        <Link
          className={scrollCueClassName}
          href={cue.url}
          onNavigate={(event) => navigateWithBlackout(event, cue.url)}
        >
          {cue.label}
          <ArrowRight />
        </Link>
      ) : (
        cue.kind === "scroll" && (
          <button
            className={scrollCueClassName}
            onClick={scrollBelowHero}
            type="button"
          >
            {cue.label}
            <ArrowRight />
          </button>
        )
      )}
    </section>
  );
};
