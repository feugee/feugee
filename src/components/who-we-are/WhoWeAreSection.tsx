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

export interface WhoWeAreSectionProps {
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
      const paragraph = textRef.current;
      if (paragraph) {
        const wordEls = paragraph.querySelectorAll("[data-reveal-word]");
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

      const list = statsRef.current;
      if (list && items.length > 0) {
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
      className="w-full max-w-[1440px] mx-auto px-6 py-12 md:px-12 md:py-20 lg:px-16 lg:py-24"
      ref={scopeRef}
    >
      <div className="flex flex-col gap-y-8 lg:gap-12 lg:flex-row">
        <div className="w-full lg:w-[30%]">
          <div className="inline-flex rounded border border-neutral-700 bg-neutral-950/70 px-3 py-1 sm:px-3.5 sm:py-1.5 md:px-4 md:py-2 backdrop-blur">
            <h2 className="text-xs sm:text-sm md:text-base text-white">{heading}</h2>
          </div>
        </div>
        <div className="w-full lg:w-[70%]">
          {description && (
            <p
              className="text-2xl md:text-[32px] lg:text-[36px] xl:text-[40px] leading-[1.25] tracking-tight text-white"
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
              className={`grid grid-cols-2 gap-x-6 gap-y-8 md:gap-x-12 md:gap-y-10 xl:grid-cols-4 xl:gap-x-12 ${
                description ? "mt-12" : ""
              }`}
              ref={statsRef}
            >
              {items.map((stat, index) => (
                <li
                  className="flex flex-col items-start"
                  data-stat-item
                  key={stat.id ?? index}
                >
                  <p className="text-[44px] md:text-[52px] xl:text-[64px] font-semibold leading-none text-secondary-500">
                    <span data-stat-value>{stat.value}</span>
                  </p>
                  <p className="mt-2 md:mt-3 text-sm md:text-base leading-tight text-neutral-400 text-left max-w-[140px] md:max-w-[180px]">
                    {stat.label}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};
