import type { ReactNode } from "react";

/**
 * The Landing Page's shared sticky-chip section heading — the Selected Works
 * heading and the Client Marquee's heading render through this one
 * component: a centered chip that sticks below the Navbar for its whole
 * section, rounded with a hairline border over a translucent dark backdrop
 * blur so the content scrolling under it stays legible. The trailing padding
 * keeps the section's content clear of the stuck chip.
 */
export const SectionHeading = ({ children }: { children: ReactNode }) => (
  <div className="sticky top-(--navbar-height) z-20 flex w-full justify-center pb-12 md:pb-16">
    <div className="rounded border border-neutral-700 bg-neutral-950/70 px-4 py-2 backdrop-blur">
      <h2 className="text-md text-center text-white">{children}</h2>
    </div>
  </div>
);
