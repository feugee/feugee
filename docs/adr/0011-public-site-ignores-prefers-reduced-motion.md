# The public site ignores prefers-reduced-motion

The public site is deliberately, centrally animated — autoplaying Hero and card videos, the Blackout page transition, scrub-driven scroll sections, drifting marquees — and it presents one motion policy to every visitor: the `prefers-reduced-motion` OS/browser setting is ignored everywhere on the Public site. Every gate originally honored the setting (frozen Posters instead of video, instant swaps instead of transitions, Lenis falling back to native scroll), which visitors on reduced-motion machines experienced as "the videos and animations are broken" — a fair description of the poster-frame behavior the gates produced. The Agency approved dropping the honoring outright rather than keeping a partial policy.

## Consequences

- Motion code carries no `prefers-reduced-motion` branches, no `motion-safe:`/`motion-reduce:` variants, and no `matchMedia` gates. Posters remain only as loading and error fallbacks — an autoplay-refused context such as a browser's Low Power Mode still shows the Poster; that is the platform refusing playback, not the site.
- Lenis is configured `respectReducedMotion: false`; scrolling is smoothed for everyone (amending ADR 0004).
- A future reader should not "helpfully" re-add reduced-motion handling piecemeal — a partially honoring site is precisely the confusing state this decision removes. If the accessibility position ever changes, re-make the decision whole: pick which surfaces honor the setting and gate them consistently.
- The CMS Dashboard is unaffected: it never animated on scroll or autoplayed media.
