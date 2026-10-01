import type { ReactNode } from "react";
import Link from "next/link";

import { ArrowRight } from "./ArrowRight";

// The quiet composition the error and not-found boundaries share — eyebrow,
// headline, body, then actions. Its classes mirror the Footer's Contact CTA
// section so a boundary page reads as the site's own voice, not the
// framework's. Deliberately free of motion and client-only APIs: boundaries
// must render server-side and work without JS.
export const boundaryActionClassName =
  "inline-flex items-center gap-2 text-white px-6 py-3 rounded border-neutral-800 border";

interface BoundaryMessageProps {
  eyebrow: string;
  headline: string;
  body: string;
  children?: ReactNode;
}

export const BoundaryMessage = ({
  eyebrow,
  headline,
  body,
  children,
}: BoundaryMessageProps) => (
  <div className="flex flex-col items-center justify-center gap-y-8 text-center md:gap-y-12">
    <div className="flex flex-col items-center gap-y-6 text-center">
      <p className="text-lg text-neutral-300 md:text-xl">{eyebrow}</p>
      <h1 className="text-4xl text-white font-bold md:text-7xl">{headline}</h1>
      <p className="max-w-xl text-lg text-neutral-300 md:text-xl">{body}</p>
    </div>
    {children}
  </div>
);

// The 404 message both not-found boundaries render — the in-chrome one for
// notFound() calls and the standalone global one for unmatched URLs — so
// their copy can't drift apart.
export const NotFoundMessage = () => (
  <BoundaryMessage
    body="The address may be mistyped, or the page isn't public yet."
    eyebrow="404"
    headline="This page has moved on."
  >
    <Link className={boundaryActionClassName} href="/">
      Back to the Landing Page <ArrowRight />
    </Link>
  </BoundaryMessage>
);
