import configPromise from "@payload-config";
import { cache } from "react";
import { getPayload } from "payload";

import type { Seo } from "@/payload-types";

/**
 * One read of the SEO global per request — every public page's metadata
 * composes its overrides and the Share Image fallback (CONTEXT.md) from it.
 * Depth 1 populates the picked images whole, so the resolvers in ogImage.ts
 * see url, dimensions, and alt.
 *
 * Never throws: metadata composes on every public page, and a failed read
 * degrades to the pages' derived defaults instead of failing the route.
 */
export const getSeoGlobal = cache(async (): Promise<Seo | null> => {
  try {
    const payload = await getPayload({ config: configPromise });
    return await payload.findGlobal({
      slug: "seo",
      draft: false,
      depth: 1,
    });
  } catch (error) {
    console.error("SEO global read failed — composing defaults only", error);
    return null;
  }
});
