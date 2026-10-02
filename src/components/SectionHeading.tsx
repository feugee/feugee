import type { ReactNode } from "react";

/**
 * The Landing Page's shared chip section heading — the Selected Works
 * heading and the Client Marquee's heading render through this one
 * component: a centered chip, rounded with a hairline border over a
 * translucent dark backdrop blur. Sticky by default, it rides below the
 * Navbar for its whole section so the content scrolling under it stays
 * legible; sections that opt out with `sticky={false}` get the same chip
 * scrolling away with the page. The trailing padding keeps the section's
 * content clear of the stuck chip.
 */
export const SectionHeading = ({
  children,
  sticky = true,
}: {
  children: ReactNode;
  sticky?: boolean;
}) => (
  <div
    className={`flex w-full justify-center pb-12 md:pb-16${sticky ? " sticky top-32 z-20" : ""}`}
  >
    <div className="rounded border border-neutral-700 bg-neutral-950/70 px-4 py-2 backdrop-blur">
      <h2 className="text-md text-center text-white">{children}</h2>
    </div>
  </div>
);
