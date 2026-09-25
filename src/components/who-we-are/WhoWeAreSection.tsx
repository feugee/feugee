"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Fragment, useRef } from "react";

import { formatStatValue, parseStatValue } from "./statValue";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export interface StatItem {
  id?: string | null;
  label: string;
  value: string;
}

interface WhoWeAreSectionProps {
  heading: string;
  description: string | null;
  stats: readonly StatItem[] | null | undefined;
}

export const WhoWeAreSection = ({
  description,
  heading,
  stats,
}: WhoWeAreSectionProps) => {
  const scopeRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const statsRef = useRef<HTMLUListElement>(null);

  const items = stats ?? [];
  const words = description === null ? [] : description.split(" ");

  // useGSAP runs before paint, so the sweep's start color never flashes the
  // other way. Raw props are the deps — stable object identity across
  // re-renders — and revertOnUpdate rebuilds the triggers when Live Preview
  // edits swap them out.
  useGSAP(
    () => {
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const paragraph = textRef.current;
      if (paragraph) {
        const wordEls = paragraph.querySelectorAll("[data-reveal-word]");
        if (reducedMotion) {
          // Skip the sweep but still land on the readable end state.
          gsap.set(wordEls, { color: "#ffffff" });
        } else {
          gsap.fromTo(
            wordEls,
            { color: "#525252" }, // neutral-600
            {
              color: "#ffffff",
              ease: "none",
              duration: 1,
              // One word at a time, so the sweep tracks scroll progress
              // word by word across the whole trigger range.
              stagger: 1,
              scrollTrigger: {
                trigger: paragraph,
                start: "top 80%",
                end: "bottom 45%",
                scrub: true,
              },
            },
          );
        }
      }

      const list = statsRef.current;
      if (list && !reducedMotion && items.length > 0) {
        const statEls = gsap.utils.toArray<HTMLElement>(
          "[data-stat-item]",
          list,
        );
        gsap.set(statEls, { opacity: 0, y: 56 });

        const enter = gsap.timeline({
          scrollTrigger: {
            trigger: list,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        });
        enter.to(statEls, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
        });
        statEls.forEach((statEl, index) => {
          const parsed = parseStatValue(items[index]?.value ?? "");
          const valueEl = statEl.querySelector("[data-stat-value]");
          if (!parsed || !valueEl) return;

          const counter = { value: 0 };
          enter.to(
            counter,
            {
              value: parsed.number,
              duration: 1.6,
              ease: "power2.out",
              onUpdate: () => {
                valueEl.textContent = formatStatValue(parsed, counter.value);
              },
            },
            0.15 + index * 0.12,
          );
        });
      }
    },
    {
      scope: scopeRef,
      dependencies: [description, heading, stats],
      revertOnUpdate: true,
    },
  );

  return (
    <section
      aria-label={heading}
      className="p-6 md:p-16 mx-auto max-w-360"
      ref={scopeRef}
    >
      <div className="flex flex-col gap-10 md:flex-row">
        <div className="w-full md:w-[30%]">
          <div className="inline-flex rounded border border-neutral-700 px-4 py-2">
            <h2 className="text-md text-white">{heading}</h2>
          </div>
        </div>
        <div className="w-full md:w-[70%]">
          {description && (
            <p
              className="text-3xl text-white md:text-[40px] leading-[1.2em]"
              ref={textRef}
            >
              {words.map((word, index) => (
                <Fragment key={index}>
                  <span className="text-neutral-600" data-reveal-word>
                    {word}
                  </span>
                  {index < words.length - 1 ? " " : null}
                </Fragment>
              ))}
            </p>
          )}
          {items.length > 0 && (
            <ul
              className={`grid grid-cols-2 gap-x-6 gap-y-10 md:flex md:gap-24 ${
                description ? "mt-8 md:mt-12" : ""
              }`}
              ref={statsRef}
            >
              {items.map((stat, index) => (
                <li data-stat-item key={stat.id ?? index}>
                  <p className="text-5xl font-semibold text-secondary-500 md:text-7xl">
                    <span data-stat-value>{stat.value}</span>
                  </p>
                  <p className="mt-3 text-xl text-neutral-300">{stat.label}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};
