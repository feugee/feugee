"use client";

import "lenis/dist/lenis.css";

import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

gsap.registerPlugin(ScrollTrigger);

let lenisInstance: Lenis | null = null;

/**
 * The Lenis instance driving public-site scroll. This module is its single
 * owner (ADR 0004) — future page transitions can pause it (`stop()`) and
 * reset it (`scrollTo(0, { immediate: true })`). Null during SSR and before
 * mount; call from event handlers and effects, not during render.
 */
export const getSmoothScroll = () => lenisInstance;

export const SmoothScroll = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  // True between a popstate event and the pathname change it triggers, so
  // back/forward navigation keeps the browser's restored scroll position.
  const traversingHistory = useRef(false);

  useEffect(() => {
    const onPopState = () => {
      traversingHistory.current = true;
      // A hash-only traversal changes no pathname, so no effect clears the
      // flag — clear it ourselves once the history dust settles.
      setTimeout(() => {
        traversingHistory.current = false;
      }, 0);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Instant top-of-page on forward navigation: Lenis's virtual position
  // must be reset alongside the router's native scroll-to-top, or the next
  // wheel event jumps back to the old offset. Page transitions will mask
  // this reset. Back/forward keeps the browser's restored position.
  useEffect(() => {
    if (traversingHistory.current) {
      traversingHistory.current = false;
      return;
    }
    lenisInstance?.scrollTo(0, { immediate: true });
  }, [pathname]);

  useEffect(() => {
    // The site ignores prefers-reduced-motion everywhere (ADR 0011), so
    // Lenis must not honor it either — smoothing stays on for everyone.
    const lenis = new Lenis({ anchors: true, respectReducedMotion: false });
    lenisInstance = lenis;

    // Lenis's rAF is driven by GSAP's ticker so the two never drift apart.
    const tick = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", () => ScrollTrigger.update());
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      if (lenisInstance === lenis) lenisInstance = null;
    };
  }, []);

  return children;
};
