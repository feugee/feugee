/**
 * The Asset Guard's decision (ADR 0012): whether an event landed on a
 * rendered Asset — an img or video element — whose casual save paths the
 * guard suppresses. Duck-types its target so the decision runs, and tests,
 * without a DOM.
 */
export const ASSET_GUARD_SELECTOR = "img, video";

export function targetsRenderedAsset(target: unknown): boolean {
  return (
    !!target &&
    typeof (target as Element).closest === "function" &&
    (target as Element).closest(ASSET_GUARD_SELECTOR) !== null
  );
}
