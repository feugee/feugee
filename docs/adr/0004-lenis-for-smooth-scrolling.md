# Lenis for smooth scrolling

The public site is animation-heavy and wants inertial (smoothed) page scrolling. GSAP is already a dependency and ships ScrollSmoother, but ScrollSmoother is transform-based — it wraps page content in a transformed container — which breaks the Work Detail Page's `position: sticky` Contents sidebar and its IntersectionObserver scroll-spy. We therefore add the `lenis` package instead: it drives the native scroll position, so sticky positioning, IntersectionObserver, and hash anchors all keep working. GSAP remains the animation tool (the Scroll Progress Bar uses ScrollTrigger, synced to Lenis via the official recipe).

## Consequences

- Lenis runs on public pages only, via a provider in the `(frontend)` layout; the CMS Dashboard is untouched.
- The provider is the single owner of the Lenis instance so the planned page-transition animations can call `stop()` and `scrollTo(0, { immediate: true })` during transitions.
- `prefers-reduced-motion: reduce` disables all smoothing; scrolling falls back to native. (Amended by ADR 0011: the public site ignores the setting, so smoothing stays on for everyone via `respectReducedMotion: false`.)
