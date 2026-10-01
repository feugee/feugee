# Asset Guard as casual deterrence only

The Agency asked that visitors not be able to download the site's media. Browser reality is that anything rendered can be extracted by a determined visitor — screenshots, devtools, the file's own URL — so the Public site ships the Asset Guard: it denies only the casual save paths (context menu, drag-out, long-press save) on rendered Assets, silently, everywhere the Public site renders, Live Preview included. Non-media surfaces keep normal behavior — text stays selectable and links keep their menus. The CMS Dashboard is untouched; editors reach raw files through the Assets collection. Embedded Videos stay out of scope — they play inside YouTube's own player and are publicly streamable there — as do inline SVGs, which are components, not Assets. Media URLs stay public: in production they point at the public-read R2 bucket, and gating them (signed URLs, referer checks) would cost caching, sharing, and SEO against a threat that has not shown up.

## Considered Options

- **Visible watermarks** — the only measure that protects the Asset itself; rejected because it changes the site's look and needs the Agency's sign-off. Revisit if actual reuse shows up.
- **URL gating** — rejected: direct-URL access is accepted as the price of public Assets; the breakage (caching, sharing, SEO) outweighs an abuse pattern nobody has observed.
- **Obfuscation (blob URLs, invisible overlays, canvas re-rendering)** — rejected: fragile to maintain, hurts accessibility and SEO, and barely raises the effort bar.

## Consequences

- A future reader should not treat the blocked context menu on media as a bug or re-enable it piecemeal — it is deliberate, and a partial guard is precisely the confusing state this decision avoids. If the protection position ever changes, re-make the decision whole.
- Determined visitors still succeed; the guard's value is removing the one-click path, and the Agency has been told as much.
- New Asset placements need no guard wiring — the guard covers whatever the Public site renders as an image or video.
