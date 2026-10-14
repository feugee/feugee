import { splitTestimonialColumns } from "./splitColumns";
import { QuoteIcon } from "@/components/QuoteIcon";

export interface TestimonialItem {
  id?: string | null;
  name: string;
  job: string | null;
  company: string | null;
  testimony: string;
}

const TestimonialCard = ({ item }: { item: TestimonialItem }) => {
  const role = [item.job, item.company].filter(Boolean).join(", ");

  return (
    <figure className="flex flex-col gap-4 border border-neutral-900 p-6">
      <QuoteIcon />
      <blockquote className="text-base leading-relaxed text-white md:text-xl">
        {item.testimony}
      </blockquote>
      <div className="border-t border-neutral-900" />
      <figcaption>
        <span className="block text-2xl font-semibold text-secondary-500">
          {item.name}
        </span>
        {role && (
          <span className="mt-1 block text-sm text-neutral-400">{role}</span>
        )}
      </figcaption>
    </figure>
  );
};

const TestimonialList = ({
  hidden,
  items,
}: {
  items: readonly TestimonialItem[];
  hidden?: boolean;
}) => (
  <ul
    aria-hidden={hidden || undefined}
    className="flex shrink-0 flex-col gap-y-1 pb-1"
  >
    {items.map((item) => (
      <li key={item.id ?? item.name}>
        <TestimonialCard item={item} />
      </li>
    ))}
  </ul>
);

/**
 * One marquee column. The track carries two identical lists and shifts by
 * exactly one list's height (its own -50%), so the loop is seamless — the
 * Client Marquee trick, stood upright. Each list's trailing padding matches
 * the item gap so the seam lands mid-rhythm, not mid-card.
 */
const MarqueeColumn = ({
  direction,
  items,
}: {
  direction: "up" | "down";
  items: readonly TestimonialItem[];
}) => (
  <div className="group/col h-120 flex-1 overflow-hidden mask-[linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] md:h-[75svh]">
    <div
      className={`flex flex-col ${
        direction === "up"
          ? "animate-marquee-up-mobile lg:animate-marquee-up"
          : "animate-marquee-down"
      }`}
    >
      <TestimonialList items={items} />
      <TestimonialList items={items} hidden />
    </div>
  </div>
);

/**
 * The Testimonials section: the Who We Are pill title and a description on
 * the left, and Agency Testimonials in two counter-scrolling columns on the
 * right — the left column rising, the right one sinking. Below md the two
 * columns fold into one full-width rising column holding every testimonial.
 */
export const TestimonialsSection = ({
  description,
  heading,
  items,
}: {
  description: string | null;
  heading: string;
  items: readonly TestimonialItem[];
}) => {
  if (items.length === 0) return null;

  const [left, right] = splitTestimonialColumns(items);

  return (
    <section aria-label={heading} className="p-6 md:p-16 mx-auto max-w-360">
      <div className="flex flex-col gap-10 lg:flex-row lg:justify-between lg:gap-x-16">
        <div className="w-full shrink-0 lg:w-[30%]">
          <div className="inline-flex rounded border border-neutral-700 px-4 py-2">
            <h2 className="text-md text-white">{heading}</h2>
          </div>
          {description && (
            <p className="mt-6 text-xl leading-relaxed text-white md:text-2xl">
              {description}
            </p>
          )}
        </div>
        <div className="w-full lg:w-[70%]">
          {/* Mobile & Tablet: one full-width rising column with every testimonial. */}
          <div className="lg:hidden">
            <MarqueeColumn direction="up" items={items} />
          </div>
          {/* Desktop: the left column rises, the right one sinks. */}
          <div className="hidden gap-1 lg:flex">
            <MarqueeColumn direction="up" items={left} />
            {right.length > 0 && (
              <MarqueeColumn direction="down" items={right} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
