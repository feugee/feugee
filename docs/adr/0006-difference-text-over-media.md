# Overlaid media text is Difference Text, not scrimmed text

Every text element that sits directly over an image or video Asset renders white with `mix-blend-mode: difference`, reading as the negative of the media behind it (the glossary term is **Difference Text**, in `CONTEXT.md`). We chose the inverted look over guaranteed contrast: over ~50% gray backdrops difference text momentarily disappears, and that is accepted as part of the aesthetic rather than papering over it with scrims.

## Consequences

- Blended text is white, with one deliberate exception: the Rotating Word keeps its secondary blue, which the blend turns into shifting complement hues over the video. The Works Rail's active mark dropped its secondary for full-opacity white against dimmed entries — the mark is information, and colored text under `difference` reads as hue-shifted noise instead of a negative.
- The blend extends past text to one filled control: the Hero's Scroll Cue is a white pill with a black label, carried on the pill itself. Under `difference` the white body inverts the media behind it while the black label rides as the un-blended media (difference with black is identity). Like blended text, its contrast is the media's business, not a scrim's.
- The Selected Works caption scrims are gone entirely. The Works Page cards keep their blur-gradient backdrop, but as an underlay *beneath* the blended text — text cannot blend through a parent that carries `backdrop-filter` or `opacity < 1`, since both isolate their children into a stacking context.
- WCAG contrast cannot be guaranteed for these surfaces. Low-contrast moments over mid-gray media are expected, not bugs.
- The blend rides the element that owns the stacking context, not the text inside it: the Hero's title container, the Pinned Caption's fixed `z-30` layer, and the Works Rail's outer `z-20` wrapper carry `mix-blend-difference` so the blend reaches the media beneath them.
- The Navbar is deliberately excluded, full stop. Blending it would mean flattening the header (multicolor logo + Menu) into one blend group and restructuring the Menu dropdown out of it; that cost was judged not worth the payoff. Its chrome stays unblended — plain white over the Hero, and past the Hero (or on a hero-less page) a frosted translucent floating bar.
