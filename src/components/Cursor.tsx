"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { useRef, useSyncExternalStore } from "react";

gsap.registerPlugin(useGSAP, CustomEase);

// The site's swipe curve (globals.css --ease-swipe) as a GSAP ease, so the
// Cursor's morph rides the same 400ms as every Swipe Text exchange.
// cubic-bezier(0.65, 0, 0.35, 1), stated in CustomEase's native path form.
CustomEase.create("swipe", "M0,0 C0.65,0 0.35,1 1,1");

const MORPH_DURATION = 0.4;
// Fast enough that the pill never feels like it's dragging behind the
// pointer, slow enough that it visibly trails — the cursor's only weight.
const FOLLOW_DURATION = 0.18;
const PILL_REST_WIDTH = 40;
const ARROW_WIDTH = 18;
// The open state's label-to-arrow gap. It lives in the label's padding only
// mid-morph: a border-box can't shrink below its own padding, so a resting
// gap there would survive max-w-0 and knock the arrow off the pill's center.
const LABEL_GAP = 8;

// The Cursor replaces the system pointer only where a real pointer exists.
// The gate re-syncs live: docking a keyboard mid-session hands the system
// pointer back.
const pointerQuery = "(hover: hover) and (pointer: fine)";

const subscribeMediaQuery =
  (query: string) =>
  (onChange: () => void): (() => void) => {
    const mediaQuery = window.matchMedia(query);
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  };

const subscribePointer = subscribeMediaQuery(pointerQuery);
const getPointerSnapshot = () => window.matchMedia(pointerQuery).matches;

const getServerSnapshot = () => false;

// Fields keep the native text caret: the Cursor fades out over them rather
// than sitting on top of the I-beam.
const EDITABLE_SELECTOR = "input, textarea, select, [contenteditable='true']";

type CursorMode = "default" | "see-more" | "play" | "hidden";

// The label each widening mode opens around; the text is set at morph time
// so one label span serves every mode.
const MODE_LABELS: Record<"see-more" | "play", string> = {
  "see-more": "See More",
  "play": "Play",
};

/**
 * The Cursor (CONTEXT.md): the Public site's own pointer — a rounded,
 * semi-transparent white pill resting as a top-left arrow, widening around
 * a "See More" label over Selected Works cards (`data-cursor="see-more"`)
 * and around a "Play" label over playable Embedded Videos
 * (`data-cursor="play"`). Entirely decorative: aria-hidden,
 * pointer-events-none, and clicks always land on whatever it floats over.
 * The [data-custom-cursor] flag it sets on <html> hides the system pointer
 * via globals.css — only once this component is actually driving, so no-JS
 * and touch visitors keep the pointer they came with.
 */
export const Cursor = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const arrowRef = useRef<SVGSVGElement>(null);

  const canShow = useSyncExternalStore(
    subscribePointer,
    getPointerSnapshot,
    getServerSnapshot,
  );

  useGSAP(
    () => {
      if (!canShow) {
        document.documentElement.removeAttribute("data-custom-cursor");
        return;
      }
      const root = rootRef.current;
      const pill = pillRef.current;
      const label = labelRef.current;
      const arrow = arrowRef.current;
      if (!root || !pill || !label || !arrow) return;

      document.documentElement.dataset.customCursor = "";

      gsap.set(root, { xPercent: -50, yPercent: -50 });
      gsap.set(arrow, { transformOrigin: "50% 50%" });

      const xTo = gsap.quickTo(root, "x", {
        duration: FOLLOW_DURATION,
        ease: "power3.out",
      });
      const yTo = gsap.quickTo(root, "y", {
        duration: FOLLOW_DURATION,
        ease: "power3.out",
      });

      // The mode is deliberately plain closure state, not React state: it
      // flips on every element boundary the pointer crosses, and none of
      // those crossings ever change what React renders.
      let mode: CursorMode = "default";
      let moved = false;

      const setVisible = (visible: boolean) =>
        gsap.to(root, {
          opacity: visible ? 1 : 0,
          duration: 0.2,
          overwrite: "auto",
        });

      const morphTo = (next: CursorMode) => {
        if (next === mode) return;
        mode = next;
        if (next === "see-more" || next === "play") {
          // Measure the label's natural box synchronously, mid-frame —
          // unclipped and stripped of the gap for the read, clipped again
          // before paint — so the pill tweens between two pixel widths
          // instead of to an "auto" it would have to measure while already
          // mid-morph. Stripping the gap keeps the read the text alone no
          // matter how far a previous morph got.
          label.textContent = MODE_LABELS[next];
          gsap.set(label, { maxWidth: "none", paddingRight: 0 });
          const labelWidth = label.offsetWidth;
          gsap.set(label, { maxWidth: 0 });
          gsap.to(pill, {
            width: PILL_REST_WIDTH + labelWidth + LABEL_GAP + ARROW_WIDTH,
            duration: MORPH_DURATION,
            ease: "swipe",
          });
          // The gap rides inside maxWidth — border-box — so the padding
          // never eats into the text it sits beside.
          gsap.to(label, {
            maxWidth: labelWidth + LABEL_GAP,
            paddingRight: LABEL_GAP,
            opacity: 1,
            duration: MORPH_DURATION,
            ease: "swipe",
          });
          gsap.to(arrow, {
            // See More aims the arrow at the top right beside the label;
            // Play aims it straight right — the direction playback goes.
            rotate: next === "see-more" ? 90 : 135,
            duration: MORPH_DURATION,
            ease: "swipe",
          });
        } else {
          gsap.to(pill, {
            width: PILL_REST_WIDTH,
            duration: MORPH_DURATION,
            ease: "swipe",
          });
          gsap.to(label, {
            maxWidth: 0,
            paddingRight: 0,
            opacity: 0,
            duration: MORPH_DURATION,
            ease: "swipe",
          });
          gsap.to(arrow, {
            rotate: 0,
            duration: MORPH_DURATION,
            ease: "swipe",
          });
          if (next === "hidden") setVisible(false);
          else if (moved) setVisible(true);
        }
      };

      const onMouseMove = (event: MouseEvent) => {
        if (!moved) {
          // Appear under the pointer, not flying in from the top-left
          // corner where the root mounts.
          moved = true;
          gsap.set(root, { x: event.clientX, y: event.clientY });
          if (mode !== "hidden") setVisible(true);
        }
        xTo(event.clientX);
        yTo(event.clientY);
      };

      const onMouseOver = (event: MouseEvent) => {
        if (!(event.target instanceof Element)) return;
        if (event.target.closest(EDITABLE_SELECTOR)) morphTo("hidden");
        else if (event.target.closest("[data-cursor='see-more']"))
          morphTo("see-more");
        else if (event.target.closest("[data-cursor='play']"))
          morphTo("play");
        else morphTo("default");
      };

      const onMouseDown = () =>
        gsap.to(pill, { scale: 0.88, duration: 0.15, ease: "power2.out" });
      const onMouseUp = () =>
        gsap.to(pill, { scale: 1, duration: 0.25, ease: "power2.out" });

      const onLeave = () => setVisible(false);
      const onEnter = (event: MouseEvent) => {
        // Re-entering somewhere else on the page should place, not glide —
        // the pill was invisible while it was gone.
        gsap.set(root, { x: event.clientX, y: event.clientY });
        if (moved && mode !== "hidden") setVisible(true);
      };

      window.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseover", onMouseOver);
      window.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mouseup", onMouseUp);
      document.documentElement.addEventListener("mouseleave", onLeave);
      document.documentElement.addEventListener("mouseenter", onEnter);

      return () => {
        window.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseover", onMouseOver);
        window.removeEventListener("mousedown", onMouseDown);
        window.removeEventListener("mouseup", onMouseUp);
        document.documentElement.removeEventListener("mouseleave", onLeave);
        document.documentElement.removeEventListener("mouseenter", onEnter);
        document.documentElement.removeAttribute("data-custom-cursor");
      };
    },
    { dependencies: [canShow], revertOnUpdate: true },
  );

  if (!canShow) return null;

  return (
    /* z-[70] keeps the Cursor above the Blackout (z-[60]) so it survives
       page transitions like the system pointer it stands in for. */
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[70] opacity-0"
      ref={rootRef}
    >
      {/* The resting width comes from w-10; every width after that is
          GSAP's. px-5 is permanent: the pill's own padding is where the
          resting arrow centers — overflow-hidden clips at the padding edge,
          not the content edge, so the arrow never sits cramped. The label
          is clipped to nothing at rest and carries no padding of its own —
          a border-box keeps its padding under max-w-0, so resting the gap
          there would shove the arrow off the pill's center, the anchor the
          visitor aims by — and the morph tweens the gap, the label's width,
          and the pill's width apart in lockstep. */}
      <div
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-black/40 px-5"
        ref={pillRef}
      >
        <span
          className="max-w-0 text-sm whitespace-nowrap text-white opacity-0"
          ref={labelRef}
        >
          See More
        </span>
        <svg
          aria-hidden="true"
          className="h-4.5 w-4.5 shrink-0 text-white"
          fill="none"
          ref={arrowRef}
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          {/* Aimed at the top left at rest; the morph's +90° turn aims it
              at the top right beside the label. */}
          <path
            d="M17 17 7 7M7 15V7h8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};
