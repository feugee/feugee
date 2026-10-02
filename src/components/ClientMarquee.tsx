import Image from "next/image";

import { SectionHeading } from "./SectionHeading";

export interface MarqueeClient {
  id: number;
  name: string;
  url: string | null;
  logo: { url: string; alt: string; width: number; height: number };
}

/**
 * Whatever colour a logo arrives in, it rides the marquee as a white
 * silhouette: grayscale, crushed to black, inverted — then dimmed. Unoptimized
 * because the filter discards the optimizer's work anyway, and client logos
 * are often SVGs the image optimizer refuses.
 */
const LogoImage = ({ client }: { client: MarqueeClient }) => (
  <Image
    alt={client.logo.alt}
    className="h-14 w-auto object-contain opacity-60 transition-opacity duration-300 hover:opacity-100 filter-[grayscale(1)_brightness(0)_invert(1)] md:h-18"
    height={client.logo.height}
    src={client.logo.url}
    unoptimized
    width={client.logo.width}
  />
);

const LogoList = ({
  clients,
  hidden,
}: {
  clients: MarqueeClient[];
  hidden?: boolean;
}) => (
  <ul
    aria-hidden={hidden || undefined}
    className="flex shrink-0 items-center gap-x-12 pr-10 md:gap-x-32 md:pr-20"
  >
    {clients.map((client) => (
      <li key={client.id}>
        {client.url ? (
          <a
            aria-label={client.name}
            className="block"
            href={client.url}
            rel="noopener noreferrer"
            target="_blank"
          >
            <LogoImage client={client} />
          </a>
        ) : (
          <LogoImage client={client} />
        )}
      </li>
    ))}
  </ul>
);

/**
 * The Client Marquee: its heading — the same chip the Selected Works
 * heading rides, minus the stick — above an endless horizontal scroll
 * built from two identical lists. The track translates left by exactly
 * one list's width (its own -50%), so the seam is invisible. Hovering
 * pauses the scroll.
 */
export const ClientMarquee = ({
  clients,
  heading,
}: {
  clients: MarqueeClient[];
  heading: string;
}) => (
  <section
    aria-label={heading}
    className="group relative border-t border-neutral-900 p-6 md:p-16"
  >
    <SectionHeading sticky={false}>{heading}</SectionHeading>
    <div className="overflow-hidden mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div className="flex w-max animate-marquee">
        <LogoList clients={clients} />
        <LogoList clients={clients} hidden />
      </div>
    </div>
  </section>
);
