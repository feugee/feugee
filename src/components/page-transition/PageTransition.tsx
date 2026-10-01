"use client";

import gsap from "gsap";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { getSmoothScroll } from "@/components/SmoothScroll";

import { setBlackoutNavigator } from "./navigateWithBlackout";
import { shouldBlackout } from "./shouldBlackout";

/*
 * The Blackout (ADR 0007): a fixed neutral-950 layer that sweeps left→right
 * across the Public site on every internal navigation — in from the left
 * edge, covering the page while the route swaps, out past the right edge.
 * The page itself (Navbar, main, Footer — [data-blackout-slab]) trails the
 * cover by a beat, drifting with its motion (the Page Shift).
 *
 * Sequencing: Link clicks arrive via onNavigate, are prevented, and the
 * navigation replays with router.push once the cover completes; the reveal
 * is gated on the new page's commit (the pathname change) with a hard cap,
 * so the covered hold doubles as a loader. History traversals can't be
 * prevented, so their cover races the swap instead. The transform on the
 * slab makes it a containing block: fixed/sticky children (the Scroll
 * Progress Bar, the Pinned Caption, sticky headers) ride with the slab for
 * the transition's ~1s instead of staying viewport-pinned — they are part
 * of the page, which is exactly the reading the Shift wants.
 */

const COVER_DURATION = 0.5;
const REVEAL_DURATION = 0.5;
// The minimum fully-covered beat, and how long the cover waits for the next
// page before revealing anyway — a rare visible swap beats trapping the
// visitor behind black.
const HOLD_MIN = 0.15;
const READY_CAP = 2.5;
const SHIFT_PERCENT = 12;
const SHIFT_LAG = 0.06;
// The settle runs a touch longer than the reveal so the page lands softly
// after the Blackout has left it behind.
const SETTLE_OVERSHOOT = 0.08;
const SETTLE_EASE = "power3.out";
// First paint waits a beat under the cover, so hydration settles behind
// black instead of mid-slide.
const INITIAL_REVEAL_DELAY = 0.15;
const EASE = "power3.inOut";

type Phase = "idle" | "covering" | "waiting" | "revealing";

export const PageTransition = () => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const state = useRef({
    phase: "idle" as Phase,
    commitSeen: false,
    capFired: false,
    holdElapsed: false,
    // The pathname the cover started under; a usePathname value differing
    // from it is the new page's commit signal.
    pathnameAtCoverStart: null as string | null,
  });
  const lastPathname = useRef(pathname);
  const lastUrl = useRef<string | null>(null);
  const revealIfReady = useRef<() => void>(() => {});

  // The state machine. Mount-once: shared state lives in refs so the
  // pathname watcher below can poke it from later renders.
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const machine = state.current;
    lastUrl.current = window.location.href;

    const slab = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>("[data-blackout-slab]"),
      );
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const tweens: gsap.core.Tween[] = [];
    const after = (ms: number, run: () => void) => {
      const handle = setTimeout(() => {
        timers.delete(handle);
        run();
      }, ms);
      timers.add(handle);
    };

    const cleanup = () => {
      gsap.set(overlay, { xPercent: -101, visibility: "hidden" });
      gsap.set(slab(), { clearProps: "transform" });
      // start() re-syncs Lenis's virtual position to the native scroll the
      // router left behind — stopped, scrollTo calls (like SmoothScroll's
      // pathname reset) were no-ops under the cover.
      getSmoothScroll()?.start();
      machine.phase = "idle";
      machine.commitSeen = false;
      machine.capFired = false;
      machine.holdElapsed = false;
      machine.pathnameAtCoverStart = null;
    };

    const reveal = () => {
      machine.phase = "revealing";
      // The settle: the committed page starts offset into the Blackout's
      // travel direction and eases to rest a beat behind the reveal. On a
      // cap-fired reveal there is no new page yet — the old one eases home
      // and the swap lands unmasked whenever it finishes. The settle
      // outlives the overlay's reveal, so it clears its own transform —
      // leftover inline transforms on the slab would contain its fixed and
      // sticky children past the transition.
      const clearSlab = () => gsap.set(slab(), { clearProps: "transform" });
      if (machine.commitSeen) {
        tweens.push(
          gsap.fromTo(
            slab(),
            { xPercent: -SHIFT_PERCENT },
            {
              xPercent: 0,
              duration: REVEAL_DURATION + SETTLE_OVERSHOOT,
              ease: SETTLE_EASE,
              delay: SHIFT_LAG,
              overwrite: "auto",
              onComplete: clearSlab,
            },
          ),
        );
      } else {
        tweens.push(
          gsap.to(slab(), {
            xPercent: 0,
            duration: REVEAL_DURATION,
            ease: SETTLE_EASE,
            overwrite: "auto",
            onComplete: clearSlab,
          }),
        );
      }
      tweens.push(
        gsap.to(overlay, {
          xPercent: 101,
          duration: REVEAL_DURATION,
          ease: EASE,
          onComplete: cleanup,
        }),
      );
    };

    const tryReveal = () => {
      if (machine.phase !== "waiting") return;
      if ((machine.commitSeen || machine.capFired) && machine.holdElapsed) reveal();
    };
    revealIfReady.current = tryReveal;

    const startHold = () => {
      machine.phase = "waiting";
      after(HOLD_MIN * 1000, () => {
        machine.holdElapsed = true;
        tryReveal();
      });
      after(READY_CAP * 1000, () => {
        machine.capFired = true;
        tryReveal();
      });
    };

    const cover = (href: string | null) => {
      // A null href means a history traversal: Next is already navigating,
      // so the cover races the swap (accepted in ADR 0007) instead of
      // leading it.
      machine.phase = "covering";
      machine.pathnameAtCoverStart = lastPathname.current;
      gsap.set(overlay, { visibility: "visible" });
      tweens.push(
        gsap.fromTo(
          overlay,
          { xPercent: -101 },
          {
            xPercent: 0,
            duration: COVER_DURATION,
            ease: EASE,
            onComplete: () => {
              const lenis = getSmoothScroll();
              if (href !== null) {
                const target = new URL(href, window.location.href);
                if (
                  target.pathname === window.location.pathname &&
                  target.search === window.location.search
                ) {
                  // Same-page click: nothing to push and the router never
                  // scrolls, so the cover hides our own reset — and the
                  // commit is already complete.
                  lenis?.scrollTo(0, { immediate: true, force: true });
                  machine.commitSeen = true;
                } else {
                  router.push(href);
                }
              }
              lenis?.stop();
              startHold();
            },
          },
        ),
      );
      tweens.push(
        gsap.fromTo(
          slab(),
          { xPercent: 0 },
          {
            xPercent: SHIFT_PERCENT,
            duration: COVER_DURATION + SETTLE_OVERSHOOT,
            ease: EASE,
            delay: SHIFT_LAG,
            overwrite: "auto",
          },
        ),
      );
    };

    const onNavigate = (event: { preventDefault: () => void }, href: string) => {
      // Input is locked while the Blackout is up: further link clicks are
      // eaten rather than queued.
      if (machine.phase !== "idle") {
        event.preventDefault();
        return;
      }
      if (!shouldBlackout(window.location.href, href)) return;
      event.preventDefault();
      cover(href);
    };

    const onPopState = () => {
      const from = lastUrl.current ?? window.location.href;
      lastUrl.current = window.location.href;
      if (machine.phase !== "idle") return;
      if (!shouldBlackout(from, window.location.href)) return;
      cover(null);
    };

    window.addEventListener("popstate", onPopState);
    setBlackoutNavigator(onNavigate);

    // First load: the SSR markup ships covering and the reveal plays over a
    // static page — no Page Shift until the planned preload animation
    // replaces this wholesale.
    tweens.push(
      gsap.fromTo(
        overlay,
        { xPercent: 0, visibility: "visible" },
        {
          xPercent: 101,
          duration: REVEAL_DURATION,
          delay: INITIAL_REVEAL_DELAY,
          ease: EASE,
          onComplete: cleanup,
        },
      ),
    );

    return () => {
      window.removeEventListener("popstate", onPopState);
      setBlackoutNavigator(null);
      revealIfReady.current = () => {};
      timers.forEach((handle) => clearTimeout(handle));
      tweens.forEach((tween) => tween.kill());
      cleanup();
    };
  }, [router]);

  // The commit watcher: while a cover is out, a pathname change is the new
  // page landing. It fires during "covering" too — the history race can
  // lose to the swap — and the flag simply waits for the hold to end.
  useEffect(() => {
    const machine = state.current;
    if (lastPathname.current !== pathname) {
      lastPathname.current = pathname;
      lastUrl.current = window.location.href;
    }
    if (machine.pathnameAtCoverStart !== null && pathname !== machine.pathnameAtCoverStart) {
      machine.commitSeen = true;
      revealIfReady.current();
    }
  }, [pathname]);

  return (
    <>
      {/* The SSR cover must not blind no-JS visitors. */}
      <noscript>
        <style>{"[data-blackout-overlay]{display:none}"}</style>
      </noscript>
      <div
        aria-hidden="true"
        className="fixed inset-0 z-[60] bg-neutral-950"
        data-blackout-overlay
        ref={overlayRef}
      />
    </>
  );
};
