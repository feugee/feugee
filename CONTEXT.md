# Feugee

The public website and content management system for Feugee, a creative agency. Built for the agency by a contracted developer; content shape is defined by the agency over time.

## Language

### Public site

The visitor-facing part of the website. Animation-heavy (scroll and page transitions).

**Landing Page**:
The site's front page a visitor lands on first.
_Avoid_: Home, homepage

**Hero**:
The opening, full-screen section of the Landing Page: a slider of autoplaying videos that stays visually still while the page scrolls over it, the title stacked in its bottom-left, and a Scroll Cue in its bottom-right.
_Avoid_: Banner, header, carousel

**Slide**:
A single video — an Asset or an Embedded Video — in the Hero's slider, shown full-screen one at a time.
_Avoid_: Frame, panel

**Lead-In Word**:
The fixed opening word of the Hero title, ahead of the Rotating Word — "Into" by default. Managed in the CMS alongside the Rotating Words.
_Avoid_: Prefix, intro word, static word

**Rotating Word**:
The changing final word of the Hero title — one of the agency-managed words that cycles in place above the slide dashes.
_Avoid_: Cycling word, animated word, swap word

**Scroll Cue**:
The button in the Hero's bottom-right signaling more content below — white with a black label, difference-blended over the Slide. Its label and optional URL are managed in the CMS; without a URL it scrolls to the content below the Hero.
_Avoid_: Scroll hint, scroll indicator, scroll arrow

**Client Marquee**:
The strip of Client logos on the Landing Page that auto-scrolls horizontally without end.
_Avoid_: Logo wall, partners, trusted-by

**Selected Works**:
The Works the Agency curates to feature on the Landing Page, in display order.
_Avoid_: Featured works, highlights

**Pinned Caption**:
The title and year of the Work currently occupying the bottom of the screen in the Selected Works section — held in one spot while Works scroll past, shown only while its Work is on screen.
_Avoid_: Sticky caption, floating caption, work overlay

**Works Rail**:
The vertical strip of one line per Work on the Selected Works section's right edge — held at the viewport's middle while the Works pass beneath it, and visible only then. Hovering swells the lines near the pointer and reveals the nearest Work's title; clicking a line scrolls the page to that Work. Desktop only.
_Avoid_: Side nav, works nav, dot nav, work indicator

**Testimonials**:
The Landing Page section below Selected Works that presents Agency Testimonials in two columns drifting in opposite directions.
_Avoid_: Reviews, quotes wall, testimonials section

**Works Page**:
The public page listing every published Work.
_Avoid_: Portfolio page, projects page

**Sector Filter**:
The Works Page's control for narrowing the listing to one Sector — a column beside the listing on desktop; on phone and tablet, a bar floating at the viewport's bottom edge, opening the Sector list in a Bottom Sheet over the page. Appears only while the page lists many Works.
_Avoid_: Filter chips, chip bar, dropdown filter, category filter

**Filter Swap**:
The Works Page exchange when the Sector Filter changes: every Work Card in the listing slides up and fades out together — Work Cards surviving the filter included, the listing swaps as one clean stage rather than a shuffling diff — and the freshly filtered set then slides in from the bottom, fading in, strictly after the stage has cleared. Played for every filter change after load, back and forward through history included; the listing's empty state takes the incoming set's place. Narrowing or widening the viewport re-lays the listing out without one.
_Avoid_: Filter animation, card transition, reorder, listing refresh

**Back to Top**:
The circular control pinned to the Works Page's bottom-right corner, above the Sector Filter's bar on phone and tablet, that returns the visitor to the top of the listing — shown only while the page lists many Works and the visitor has scrolled away from the top.
_Avoid_: Scroll-to-top button, up button, top button

**Work Card**:
A card in the Works Page's listing presenting one Work — its Thumbnail, title, first Expertise, and optional Badge — linking to the Work Detail Page. Distinct from the Footer's Other Works cards and Selected Works' full-viewport cards.
_Avoid_: Portfolio tile, project card, work tile

**Badge**:
A short, reusable marker the Agency attaches to a Work — a name, an icon, and a color. At most one per Work; renaming or recoloring a Badge updates every Work that references it. Shown on the Work Card, and fixed at the right of the Work Detail Page on every viewport — icon and name shown together, readable with no interaction. Distinct from Sector, the Works Page's filter facet, and Expertise, the disciplines applied to a Work.
_Avoid_: Tag, label, ribbon, sticker

**Work Detail Page**:
The public page presenting one Work in depth.
_Avoid_: Case study page, project page

**Work**:
A single portfolio piece the agency presents publicly. Richly detailed — not a simple record. Presented as a sequence of Sections; its core field shape is defined.
_Avoid_: Project, portfolio item, case study

**Thumbnail**:
The primary visual representing a Work — shown at the top of the Work Detail Page, as its card on the Works Page and the Footer's Other Works, and as its card in Selected Works when the Work has no Feature Visual. An image Asset, a video Asset, or an Embedded Video. In its card placements a video Thumbnail plays as a muted, looping ambient visual; at the top of the Work Detail Page an Embedded Video Thumbnail is click-to-play with sound and player controls, while a video Asset Thumbnail keeps the muted loop.
_Avoid_: Cover, hero image, featured image

**Feature Visual**:
The optional visual — an image Asset, a video Asset, or an Embedded Video — shown in place of a Work's Thumbnail as its card in Selected Works. Absent one, the Work falls back to its Thumbnail there; every other surface keeps the Thumbnail regardless.
_Avoid_: Feature video, selected works video, landing video

**Section**:
A titled group of content within a Work. Each Section is one destination in the Work Detail Page's Contents.
_Avoid_: Chapter, part, block

**Contents**:
The Work Detail Page navigation listing a Work's Sections in display order and tracking the Active Section — a sticky sidebar column on desktop; on phone and tablet, a bar floating at the viewport's bottom edge once the page moves past the Hero, opening the list in a Bottom Sheet over the page.
_Avoid_: Table of contents, section nav, TOC

**Active Section**:
The Section currently on screen while a visitor reads a Work — the one the Contents highlights in its list and names in its bar. It is the Section crossing a band near the top of the viewport.
_Avoid_: Current section, selected section

**Layout**:
A named arrangement from a fixed vocabulary that positions Items on a grid. Each Layout determines how many Items it holds and where each one sits.
_Avoid_: Grid, row, layout type

**Item**:
A single content cell within a Layout — a standalone title, a set of paragraphs (titled or plain), or an Asset or Embedded Video.
_Avoid_: Cell, block, element

**Scroll Progress Bar**:
A thin fixed bar at the top of a public page that fills left to right as the visitor scrolls through the page's main content — revealing a primary-to-secondary horizontal gradient that holds its screen position while the bar fills.
_Avoid_: Progress indicator, reading bar, scroll tracker

**Cursor**:
The Public site's own pointer, standing in for the system's on hover-capable devices: a rounded, semi-transparent black pill carrying a white arrow aimed at the top left. Its anchor — the point the visitor aims by, since the system pointer is hidden — is the pill's center, which sits exactly under the system pointer's position in every state. Over the cards in Selected Works it widens around a "See More" label while the arrow turns to aim at the top right; over playable Embedded Videos it widens around a "Play" label with the arrow aiming straight right; over a Work's card placements carrying a Client Logo it grows to an unpainted square around that logo alone, the arrow withdrawn — falling back to its usual state on Works without one.
_Avoid_: Custom cursor, mouse follower, cursor dot

**Blackout**:
The black screen that hides one public page being swapped for another: it enters from the left edge to cover the page, then exits past the right edge — always traveling left to right, over everything else on the page.
_Avoid_: Curtain, Cover, black screen swipe, transition panel

**Page Shift**:
The whole page — Navbar, content, and Footer as one slab — drifting slightly rightward as the Blackout covers it, and the incoming page settling into place from a leftward offset as the Blackout reveals it, trailing a beat behind the Blackout's own motion.
_Avoid_: Page slide, parallax, push, page transition animation

**Navbar**:
The strip at the top of every public page: the logo and the Menu control. Transparent at the top of the page; becomes a frosted floating bar once the visitor scrolls — past the Hero where there is one, or on any page without one.
_Avoid_: Header, top bar, navigation bar

**Menu**:
The public site's primary navigation, opened on every viewport. On desktop it is a full-height panel sliding in from the right edge — the Navbar's bar giving up the panel's column while keeping its left anchor, so the logo stays in place and the bar's right edge rides flush with the panel's left — while the rest of the page stills under a dimmed veil. On a phone or tablet it is a full-screen layer at the front of the page, the Navbar keeping its shape untouched beneath it, closed by an X of its own at the top right. Its control is a two-line icon (the second line shorter and right-justified) that grows its lines to equal length and rotates them into an X while open. Its items are edge-to-edge rows, flush one atop the next, that highlight under the pointer while Arrow Push's arrow slides in — no notion of a current item. Its links are the Footer's menu links, and below a divider its foot carries the Footer's Social Links — all managed once in the CMS.
_Avoid_: Nav, hamburger, overlay menu, dropdown, sidebar

**Footer**:
The strip at the bottom of every public page: the Contact CTA, an About blurb, Other Works cards, menu links, contact details, and the Wordmark behind the bottom bar. Its content is a global in the CMS, separate from the Landing Page.
_Avoid_: Bottom bar, site footer, footer section

**Other Works**:
The Works shown as cards in the Footer, in display order. Distinct from the Landing Page's Selected Works.
_Avoid_: Other projects, featured works

**Social Link**:
A social media profile linked from the Footer's bottom bar and the Menu's foot — a platform (which picks the icon) and its URL.
_Avoid_: Social icon, social media button

**Wordmark**:
The Agency's FEUGEE logo artwork stretched edge-to-edge behind the Footer's bottom bar as a quiet monochrome watermark — the same artwork the Navbar shows small at full color. Part of the site's code, not CMS content.
_Avoid_: Giant logo, footer logo, display wordmark

**Asset Guard**:
The Public site behavior denying visitors the casual save paths for rendered Assets — no browser context menu, no dragging an image out of the page, no long-press save on touch screens. Deliberate deterrence only: a determined visitor (screenshots, devtools, the Asset's own URL) still gets the file.
_Avoid_: Image protection, right-click blocking, no-download mode, DRM

### CMS

The authenticated area where the agency manages public site content.

**CMS Dashboard**:
The admin area where the agency manages the content of the public pages.
_Avoid_: Admin panel, back office

**Agency**:
Feugee itself — the owner of the site and its content. Distinguished from a site visitor or the developer.
_Avoid_: Client, owner, user

**Client**:
The external company a Work was made for. Distinct from the Agency and from a site visitor.
_Avoid_: Customer, brand, partner

**Client Logo**:
An image Asset showing the Client a Work was made for, uploaded to the Work itself and shown by the Cursor over that Work's card placements. Distinct from the Clients collection's logos, which feed the Client Marquee.
_Avoid_: Brand mark, client icon, work logo

**Asset**:
An uploaded image or video file managed by the CMS and referenced by site content.
_Avoid_: Media, file, upload

**Embedded Video**:
An external video — YouTube today — that the CMS references by URL instead of storing as an uploaded file. Ambient like any video Asset in the Hero's Slides and the Works' card placements; in a Work's content surfaces — the top of the Work Detail Page and its Layout Items — click-to-play from its Poster with sound and player controls. Always with a Poster.
_Avoid_: YouTube video, external video, video link

**Video Source**:
The either/or every video-consuming field presents: an uploaded video Asset or an Embedded Video. Exactly one is set — never both.
_Avoid_: Video type, media type, video kind

**Poster**:
The image Asset standing in for a video before it plays. Serves as the preview frame and — because Payload measures no dimensions for videos — as the video's aspect ratio in the Works masonry and Layouts. An Embedded Video's Poster is the provider's own thumbnail, brought in as an image Asset.
_Avoid_: Still frame, preview image, thumbnail frame

**Size ladder**:
The four WebP variants the CMS generates for each image Asset — thumbnail 640, tablet 1024, desktop 1600, wide 2400 — that public placements request instead of original files. A size wider than the original is skipped; a placement falls back to the closest variant that exists, ending at the original file. Videos and SVGs get none (a video's Poster is a separate image Asset with its own variants).
_Avoid_: Thumbnails (the CMS sense), responsive sizes, srcset

**Draft**:
A Work visible only inside the CMS Dashboard, not yet shown on the public site.
_Avoid_: Unpublished, pending

**Published**:
A Work visible on the public site. Only the Agency can publish.
_Avoid_: Live, released

**Subtitle**:
The short tagline under a Work's title on the Work Detail Page.
_Avoid_: Tagline, strapline, description

**Description**:
A Work's summary prose — rich text shown on the Work Detail Page below the meta rows, under its Overview label. Optional; a Work without one shows no Overview block.
_Avoid_: Overview, blurb, summary, about

**Overview**:
The heading over a Work's Description on the Work Detail Page — "Overview" out of the box, editable per Work in the CMS; an empty label leaves the Description unheaded.
_Avoid_: Description label, section heading

**Sector**:
The industry a Work was created for; the facet the Works Page filters Works by.
_Avoid_: Category, industry, vertical

**Year**:
The year a Work was produced or released.
_Avoid_: Date, date completed

**Associate**:
The project lead responsible for a Work.
_Avoid_: Partner, collaborator

**Project Team**:
The Agency's own staff credited on a Work.
_Avoid_: Team members, staff list

**Collaborator**:
A person outside the Agency credited on a Work.
_Avoid_: Contributor, partner

**Expertise**:
The creative disciplines the Agency applied to a Work.
_Avoid_: Skills, services

**Testimonial**:
A quoted endorsement of a Work, attributed to a named person and their company. Distinct from the Agency Testimonial.
_Avoid_: Quote, review

**Agency Testimonial**:
A quoted endorsement of the Agency itself — not tied to any one Work — attributed to a named person, their job, and their company.
_Avoid_: Quote, review, landing testimonial

**Stat**:
A proof figure on the Landing Page, as a value with a label — e.g. "55+" with "Videos".
_Avoid_: Metric, counter, fact

**Contact CTA**:
The closing call-to-action at the top of the Footer on every public page — an eyebrow, headline, body copy, and up to two action buttons, each with its own label and URL; the second appears only when filled in. Managed as the `cta` group on the Footer global.
_Avoid_: Contact section, CTA banner

**Contact Details**:
The Footer's contact block — a heading, an optional call-to-action link, and the Agency's email and phone. Distinct from the Contact CTA.
_Avoid_: Contact info, contact section

### Design

**Design Tokens**:
The canonical visual values — colors and typography — shared by the Public site and the CMS Dashboard. Handed off from the Agency's Figma; `docs/DESIGN_SYSTEMS.md` is the source of record. One light mode only.
_Avoid_: Theme, palette, brand kit

**Difference Text**:
Text the Public site renders white with difference blending over an image or video Asset, so it reads as the negative of whatever passes behind it.
_Avoid_: Negative text, inverted text, knockout text, blend text

**Swipe Text**:
A control's label exchanging two clipped copies on hover — the resting copy swipes up out of view while an identical primary-500 copy swipes up from below into its place. Used on the Footer's menu links.
_Avoid_: Rolling text, text swap, slide-up hover

**Arrow Push**:
A control's current affordance and the Menu's items' hover: a primary arrow slides in from the left, pushing the label right. The hovered label turns white; the current one stays primary. On the Works Page's Sector Filter and the Work Detail Page's Contents the arrow is current-only — their hover keeps the label's slide but shows no arrow.
_Avoid_: Arrow slide, push-in, arrow reveal

**Bottom Sheet**:
A panel that rises from the viewport's bottom edge over a dimmed page on phone and tablet — the shape both the Work Detail Page's Contents and the Works Page's Sector Filter open their lists in.
_Avoid_: Drawer, modal, dialog, popup
