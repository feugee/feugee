# Feugee

The public website and content management system for Feugee, a creative agency. Built for the agency by a contracted developer; content shape is defined by the agency over time.

## Language

### Public site

The visitor-facing part of the website. Animation-heavy (scroll and page transitions).

**Landing Page**:
The site's front page a visitor lands on first.
_Avoid_: Home, homepage

**Hero**:
The opening, full-screen section of the Landing Page: a slider of autoplaying video Assets that stays visually still while the page scrolls over it, the title stacked in its bottom-left, and a Scroll Cue in its bottom-right.
_Avoid_: Banner, header, carousel

**Slide**:
A single video Asset in the Hero's slider, shown full-screen one at a time.
_Avoid_: Frame, panel

**Rotating Word**:
The changing final word of the Hero title — one of the agency-managed words that cycles in place above the slide dashes.
_Avoid_: Cycling word, animated word, swap word

**Scroll Cue**:
The "| Scroll to explore" text in the Hero's bottom-right signaling more content below.
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
The vertical strip of Work titles along the right edge of the Selected Works section, travelling from the first Work's middle to the last Work's middle; the arrow marks the Work the Rail itself is sitting on. An indicator only: nothing in it is clickable.
_Avoid_: Side nav, works nav, dot nav, work indicator

**Testimonials**:
The Landing Page section below Selected Works that presents Agency Testimonials in two columns drifting in opposite directions.
_Avoid_: Reviews, quotes wall, testimonials section

**Works Page**:
The public page listing every published Work.
_Avoid_: Portfolio page, projects page

**Work Detail Page**:
The public page presenting one Work in depth.
_Avoid_: Case study page, project page

**Work**:
A single portfolio piece the agency presents publicly. Richly detailed — not a simple record. Presented as a sequence of Sections; its core field shape is defined.
_Avoid_: Project, portfolio item, case study

**Thumbnail**:
The primary visual representing a Work — shown at the top of the Work Detail Page, as its card on the Works Page and the Footer's Other Works, and as its card in Selected Works when the Work has no Feature Visual. An Asset — image or video. A video Thumbnail plays muted, looping, and without controls, like every video on the public site.
_Avoid_: Cover, hero image, featured image

**Feature Visual**:
The optional Asset — image or video — shown in place of a Work's Thumbnail as its card in Selected Works. Absent one, the Work falls back to its Thumbnail there; every other surface keeps the Thumbnail regardless.
_Avoid_: Feature video, selected works video, landing video

**Section**:
A titled group of content within a Work. Each Section is one destination in the Work Detail Page's sidebar navigation.
_Avoid_: Chapter, part, block

**Layout**:
A named arrangement from a fixed vocabulary that positions Items on a grid. Each Layout determines how many Items it holds and where each one sits.
_Avoid_: Grid, row, layout type

**Item**:
A single content cell within a Layout — a standalone title, a set of paragraphs (titled or plain), or an Asset.
_Avoid_: Cell, block, element

**Scroll Progress Bar**:
A thin fixed bar at the top of a public page that fills left to right as the visitor scrolls through the page's main content — revealing a primary-to-secondary horizontal gradient that holds its screen position while the bar fills.
_Avoid_: Progress indicator, reading bar, scroll tracker

**Cursor**:
The Public site's own pointer, standing in for the system's on hover-capable devices: a rounded, semi-transparent white pill rendered with difference blending, carrying a white arrow aimed at the top left. Over the cards in Selected Works it widens around a "See More" label while the arrow turns to aim at the top right.
_Avoid_: Custom cursor, mouse follower, cursor dot

**Blackout**:
The black screen that hides one public page being swapped for another: it enters from the left edge to cover the page, then exits past the right edge — always traveling left to right, over everything else on the page.
_Avoid_: Curtain, Cover, black screen swipe, transition panel

**Page Shift**:
The whole page — Navbar, content, and Footer as one slab — drifting slightly rightward as the Blackout covers it, and the incoming page settling into place from a leftward offset as the Blackout reveals it, trailing a beat behind the Blackout's own motion.
_Avoid_: Page slide, parallax, push, page transition animation

**Navbar**:
The strip at the top of every public page: the logo and the Menu control. Transparent while over the Hero; becomes a frosted floating bar once the visitor scrolls past the Hero — and on pages without a Hero, always.
_Avoid_: Header, top bar, navigation bar

**Menu**:
The public site's primary navigation, opened as a dropdown from the Navbar on every viewport — whose control is a two-line icon (the second line shorter and right-justified) that grows its lines to equal length and rotates them into an X while open. Its links are the Footer's menu links — managed once in the CMS.
_Avoid_: Nav, hamburger, overlay menu, navigation drawer

**Footer**:
The strip at the bottom of every public page: the Contact CTA, an About blurb, Other Works cards, menu links, contact details, and the Wordmark behind the bottom bar. Its content is a global in the CMS, separate from the Landing Page.
_Avoid_: Bottom bar, site footer, footer section

**Other Works**:
The Works shown as cards in the Footer, in display order. Distinct from the Landing Page's Selected Works.
_Avoid_: Other projects, featured works

**Social Link**:
A social media profile linked from the Footer's bottom bar — a platform (which picks the icon) and its URL.
_Avoid_: Social icon, social media button

**Wordmark**:
The Agency's FEUGEE logo artwork stretched edge-to-edge behind the Footer's bottom bar as a quiet monochrome watermark — the same artwork the Navbar shows small at full color. Part of the site's code, not CMS content.
_Avoid_: Giant logo, footer logo, display wordmark

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

**Asset**:
An uploaded image or video file managed by the CMS and referenced by site content.
_Avoid_: Media, file, upload

**Poster**:
The image Asset standing in for a video Asset before it plays. Serves as the preview frame and — because Payload measures no dimensions for videos — as the video's aspect ratio in the Works masonry and Layouts.
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
The closing call-to-action at the top of the Footer on every public page — an eyebrow, headline, body copy, and the Work with us button. Managed as the `cta` group on the Footer global.
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
A control's label exchanging two clipped copies on hover — the resting copy swipes up out of view while an identical primary-500 copy swipes up from below into its place. Used on the Menu's items and the Footer's menu links.
_Avoid_: Rolling text, text swap, slide-up hover
