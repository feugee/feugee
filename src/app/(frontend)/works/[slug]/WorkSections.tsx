import type { Work } from "@/payload-types";

import type { AssetSizeName } from "@/components/work";

import { WorkItemView, type WorkItem } from "./WorkItems";

export type WorkSection = NonNullable<Work["sections"]>[number];
export type WorkLayout = NonNullable<WorkSection["layouts"]>[number];

export const sectionAnchor = (index: number) => `section-${index}`;

// Grids switch on at lg — below it every Layout stacks into one column.
// The tracks are minmax(0,1fr), not bare 1fr: a track's auto minimum refuses
// to shrink below an Asset's intrinsic width and pushes it past the screen.
const layoutClass: Record<WorkLayout["blockType"], string> = {
  "one-column": "grid grid-cols-[minmax(0,1fr)] gap-[4px]",
  "two-column": "grid gap-[4px] lg:grid-cols-[repeat(2,minmax(0,1fr))]",
  "three-column": "grid gap-[4px] lg:grid-cols-[repeat(3,minmax(0,1fr))]",
  // Item 1 spans both rows on the left; items 2 and 3 stack top and bottom right.
  "feature-left":
    "grid gap-[4px] lg:grid-cols-[repeat(2,minmax(0,1fr))] lg:grid-rows-2",
  // Item 1 spans both rows on the right; items 2 and 3 stack top and bottom left.
  "feature-right":
    "grid gap-[4px] lg:grid-cols-[repeat(2,minmax(0,1fr))] lg:grid-rows-2",
};

const itemClass = (layout: WorkLayout, index: number) => {
  if (layout.blockType === "feature-left") {
    return index === 0 ? "lg:row-span-2" : "";
  }
  if (layout.blockType === "feature-right") {
    if (index === 0) return "lg:col-start-2 lg:row-span-2";
    return index === 1
      ? "lg:col-start-1 lg:row-start-1"
      : "lg:col-start-1 lg:row-start-2";
  }
  return "";
};

// The variant an Asset item requests, from its cell in the layout: only a
// one-column item spans the full content column (desktop); every other
// layout's cells are at most half of it (tablet). Below lg the layouts stack
// full width, but never past the 1024px the tablet variant covers.
const assetSizeForLayout = (layout: WorkLayout): AssetSizeName =>
  layout.blockType === "one-column" ? "desktop" : "tablet";

export const WorkSections = ({ sections }: { sections: Work["sections"] }) => {
  if (!sections?.length) return null;

  return (
    <div className="w-full space-y-1 pb-8">
      {sections.map((section, sectionIndex) => (
        <section
          key={section.id ?? sectionIndex}
          id={sectionAnchor(sectionIndex)}
          className="scroll-mt-[calc(var(--navbar-height)+0.5rem)] space-y-1"
        >
          {(section.layouts ?? []).map((layout, layoutIndex) => (
            <div
              key={layout.id ?? layoutIndex}
              className={layoutClass[layout.blockType]}
            >
              {(layout.items ?? []).map((item: WorkItem, itemIndex) => (
                <div
                  key={item.id ?? itemIndex}
                  // min-w-0 pairs with the minmax(0,1fr) tracks: a grid item's
                  // auto minimum is its content's intrinsic width, so an Asset
                  // would still overflow its cell without it.
                  className={`min-w-0 ${itemClass(layout, itemIndex)}`}
                >
                  <WorkItemView
                    assetSize={assetSizeForLayout(layout)}
                    item={item}
                  />
                </div>
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
};
