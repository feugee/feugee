"use client";

import { useEffect } from "react";

import { targetsRenderedAsset } from "./assetGuard";

/**
 * Asset Guard (ADR 0012): denies visitors the casual save paths for
 * rendered Assets — the browser's context menu, dragging an image out of
 * the page, long-press save — silently. Delegated on document, so future
 * Asset placements need no wiring; every non-media surface keeps its
 * normal behavior. Deterrence only, by design.
 */
export const AssetGuard = () => {
  useEffect(() => {
    const suppress = (event: Event) => {
      if (targetsRenderedAsset(event.target)) event.preventDefault();
    };

    document.addEventListener("contextmenu", suppress);
    document.addEventListener("dragstart", suppress);
    return () => {
      document.removeEventListener("contextmenu", suppress);
      document.removeEventListener("dragstart", suppress);
    };
  }, []);

  return null;
};
