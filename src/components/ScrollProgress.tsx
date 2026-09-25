"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, type RefObject } from "react";

import { scrollProgressClipInset } from "./scrollProgress";

gsap.registerPlugin(ScrollTrigger);

export const ScrollProgress = ({
  scope,
}: {
  scope?: RefObject<HTMLElement | null>;
}) => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    // The tween's subject is a plain 0→1 proxy. Scrub renders it on every
    // scroll — and once up front, covering a restored scroll position — and
    // onUpdate maps progress into the gradient layer's right inset. The
    // layer itself never transforms, so the gradient holds its screen
    // position while the bar reveals.
    const progress = { value: 0 };

    const tween = gsap.to(progress, {
      value: 1,
      ease: "none",
      onUpdate: () => {
        bar.style.clipPath = scrollProgressClipInset(progress.value);
      },
      scrollTrigger: scope?.current
        ? // Scoped progress: 0% when the element's top reaches the top of the
          // viewport, 100% when its bottom reaches the bottom.
          {
            trigger: scope.current,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          }
        : // Document-wide progress: scroll position 0 to max scroll.
          {
            start: 0,
            end: "max",
            scrub: true,
            // Direct mapping — Lenis already smooths the scroll position, and
            // under reduced motion instant tracking is exactly what we want.
          },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [scope]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px] bg-linear-to-r from-primary-500 to-secondary-500"
      ref={barRef}
      // Fully clipped in the SSR markup so the bar never flashes full-width
      // before the ScrollTrigger takes over.
      style={{ clipPath: scrollProgressClipInset(0) }}
    />
  );
};
