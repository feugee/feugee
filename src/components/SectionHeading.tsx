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
 *
 * When `overlap` is true the heading occupies no vertical flow space: it
 * floats over the content beneath it via a negative margin, so the first
 * child after it starts at the same vertical position. Used by the
 * Selected Works section to place the tag inside the media area.
 */
export const SectionHeading = ({
  children,
  overlap = false,
  sticky = true,
}: {
  children: ReactNode;
  overlap?: boolean;
  sticky?: boolean;
}) => {
  const pb = overlap ? "" : " pb-8 md:pb-12";
  const stickyClass = sticky ? " sticky top-32 z-20" : "";
  // A negative margin equal to the element's full height collapses its
  // flow contribution to zero. The heading still paints and sticks, but
  // the next sibling starts where this element would have begun.
  const overlapClass = overlap ? " -mb-[100%]" : "";

  return (
    <div className={`flex w-full justify-center${pb}${stickyClass}${overlapClass}`}>
      <div className="rounded border border-neutral-700 bg-neutral-950/70 px-3 py-1 sm:px-3.5 sm:py-1.5 md:px-4 md:py-2 backdrop-blur">
        <h2 className="text-xs sm:text-sm md:text-base text-center text-white">{children}</h2>
      </div>
    </div>
  );
};
