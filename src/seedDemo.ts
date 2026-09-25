import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import sharp from "sharp"
import type { Payload } from "payload"

// Demo content (sample Sectors, Assets, Works, Clients, the Landing Page, the
// Footer) is optional: outside production it always seeds, so local dev keeps its
// populated site; in production it needs SEED_DEMO=true ("true" or "1") —
// a production seed then creates the admin user only.
const DEMO_FLAG_VALUES = ["true", "1"]

export function shouldSeedDemoContent(env: {
  NODE_ENV?: string
  SEED_DEMO?: string
}): boolean {
  if (env.NODE_ENV !== "production") return true
  return DEMO_FLAG_VALUES.includes(env.SEED_DEMO ?? "")
}

// Seeding writes are setup, not CMS edits — the revalidation hooks skip them
// (they have no Next request scope in a payload run script anyway).
export const noRevalidate = { disableRevalidate: true }

export async function seedDemoContent(payload: Payload): Promise<void> {
  const lexicalParagraph = (text: string) => ({
    root: {
      type: "root" as const,
      direction: "ltr" as const,
      format: "" as const,
      indent: 0,
      version: 1,
      children: [
        {
          type: "paragraph" as const,
          direction: "ltr" as const,
          format: "" as const,
          indent: 0,
          textFormat: 0,
          textStyle: "",
          version: 1,
          children: [
            {
              detail: 0,
              format: 0,
              mode: "normal" as const,
              style: "",
              text,
              type: "text" as const,
              version: 1,
            },
          ],
        },
      ],
    },
  })

  const sectorNames = ["Fashion", "Music", "Culture"]
  const sectorIds: Record<string, number> = {}
  const existingSectors = await payload.find({
    collection: "sectors",
    limit: sectorNames.length,
    where: {
      name: { in: sectorNames },
    },
  })

  if (existingSectors.docs.length === 0) {
    for (const name of sectorNames) {
      const sector = await payload.create({
        collection: "sectors",
        context: noRevalidate,
        data: { name },
      })
      sectorIds[name] = sector.id
    }
    payload.logger.info(`Seeded sectors: ${sectorNames.join(", ")}`)
  } else {
    for (const sector of existingSectors.docs) {
      if (typeof sector.name === "string") {
        sectorIds[sector.name] = sector.id
      }
    }
    payload.logger.info("Sectors already exist — skipping sector seed")
  }

  const assetDefs = [
    {
      key: "solsticeFeature",
      name: "solstice-feature.png",
      width: 1200,
      height: 1600,
      background: "#8b6f47",
      alt: "Archival denim jacket photographed against a warm studio backdrop",
    },
    {
      key: "solsticeStationery",
      name: "solstice-stationery.png",
      width: 1600,
      height: 900,
      background: "#c9b8a3",
      alt: "Flat-lay of the rebranded stationery suite",
    },
    {
      key: "solsticeStorefront",
      name: "solstice-storefront.png",
      width: 1600,
      height: 900,
      background: "#5f6b4f",
      alt: "Storefront signage at dusk",
    },
    {
      key: "pulsePoster1",
      name: "pulse-poster-1.png",
      width: 1600,
      height: 900,
      background: "#d94f30",
      alt: "Festival poster variant generated from a headliner waveform",
    },
    {
      key: "pulsePoster2",
      name: "pulse-poster-2.png",
      width: 1600,
      height: 900,
      background: "#274b9f",
      alt: "Festival poster variant generated from a support act waveform",
    },
    {
      key: "pulsePoster3",
      name: "pulse-poster-3.png",
      width: 1600,
      height: 900,
      background: "#e8b23a",
      alt: "Festival poster variant in the late-night colourway",
    },
    {
      key: "pulseStageWide",
      name: "pulse-stage-wide.png",
      width: 1600,
      height: 900,
      background: "#1c1c2e",
      alt: "Main stage wide shot on opening night",
    },
    {
      key: "pulseStagePortrait",
      name: "pulse-stage-portrait.png",
      width: 1200,
      height: 1600,
      background: "#43216b",
      alt: "Crowd silhouetted under purple stage lights",
    },
  ]

  const solidImage = async (def: (typeof assetDefs)[number]) => {
    const data = await sharp({
      create: {
        width: def.width,
        height: def.height,
        channels: 3,
        background: def.background,
      },
    })
      .png()
      .toBuffer()

    return { data, mimetype: "image/png", name: def.name, size: data.length }
  }

  const assetIds: Record<(typeof assetDefs)[number]["key"], number> = {}
  const existingAssets = await payload.find({
    collection: "assets",
    limit: assetDefs.length,
    where: {
      filename: { in: assetDefs.map((def) => def.name) },
    },
  })

  const assetIdByFilename = new Map<string, number>()
  for (const doc of existingAssets.docs) {
    if (doc.filename) {
      assetIdByFilename.set(doc.filename, doc.id)
    }
  }

  let createdAssets = 0
  for (const def of assetDefs) {
    let id = assetIdByFilename.get(def.name)
    if (id === undefined) {
      const asset = await payload.create({
        collection: "assets",
        context: noRevalidate,
        data: { alt: def.alt },
        file: await solidImage(def),
      })
      id = asset.id
      assetIdByFilename.set(def.name, id)
      createdAssets++
    }
    assetIds[def.key] = id
  }

  if (createdAssets === 0) {
    payload.logger.info("Assets already exist — skipping asset seed")
  } else {
    payload.logger.info(`Seeded ${createdAssets} new assets (${assetDefs.length} total)`)
  }

  // Video Assets are generated with ffmpeg: an animated gradient clip plus its
  // first frame as the poster image. Without ffmpeg on the machine the video
  // fixtures are skipped and the Works stay image-only.
  type VideoDef = {
    key: string
    name: string
    posterName: string
    alt: string
    // The lavfi "gradients" source — each def carries its own colourway, pace,
    // and duration (the hero loops match the slider's 8-second interval).
    gradient: string
    duration: number
  }

  const videoDefs: VideoDef[] = [
    {
      key: "pulseTeaser",
      name: "pulse-teaser.mp4",
      posterName: "pulse-teaser-poster.png",
      alt: "Animated gradient teaser in the Pulse Festival colourway",
      gradient:
        "gradients=size=1280x720:duration=4:rate=30:speed=0.03:c0=0xd94f30:c1=0x274b9f",
      duration: 4,
    },
    {
      key: "heroEmber",
      name: "hero-loop-ember.mp4",
      posterName: "hero-loop-ember-poster.png",
      alt: "Drifting loop from brand orange into black",
      gradient:
        "gradients=size=1280x720:duration=8:rate=30:speed=0.025:c0=0xf2631c:c1=0x191919",
      duration: 8,
    },
    {
      key: "heroTide",
      name: "hero-loop-tide.mp4",
      posterName: "hero-loop-tide-poster.png",
      alt: "Drifting loop in the secondary blue palette",
      gradient:
        "gradients=size=1280x720:duration=8:rate=30:speed=0.035:c0=0x60b4e2:c1=0x1c2e52",
      duration: 8,
    },
    {
      key: "heroInk",
      name: "hero-loop-ink.mp4",
      posterName: "hero-loop-ink-poster.png",
      alt: "Drifting loop from violet into near-black",
      gradient:
        "gradients=size=1280x720:duration=8:rate=30:speed=0.02:c0=0x7a3fb0:c1=0x14141f",
      duration: 8,
    },
  ]

  const videoAssetIds: Record<(typeof videoDefs)[number]["key"], number> = {}

  const hasFfmpeg = (() => {
    try {
      execFileSync("ffmpeg", ["-version"], { stdio: "ignore" })
      return true
    } catch {
      return false
    }
  })()

  let createdVideos = 0
  if (!hasFfmpeg) {
    payload.logger.info("ffmpeg not found — skipping video asset seed")
  } else {
    const tmp = mkdtempSync(path.join(tmpdir(), "feugee-seed-"))
    try {
      for (const def of videoDefs) {
        const existingVideo = await payload.find({
          collection: "assets",
          limit: 1,
          where: { filename: { equals: def.name } },
        })
        if (existingVideo.docs.length > 0) {
          videoAssetIds[def.key] = existingVideo.docs[0].id
          continue
        }

        const videoPath = path.join(tmp, def.name)
        const posterPath = path.join(tmp, def.posterName)
        execFileSync("ffmpeg", [
          "-f",
          "lavfi",
          "-i",
          // A slowly drifting two-colour gradient — clearly in motion, safely
          // looping, tiny file.
          def.gradient,
          "-t",
          String(def.duration),
          "-pix_fmt",
          "yuv420p",
          "-movflags",
          "+faststart",
          videoPath,
        ])
        execFileSync("ffmpeg", ["-i", videoPath, "-frames:v", "1", posterPath])

        const posterData = readFileSync(posterPath)
        const poster = await payload.create({
          collection: "assets",
          context: noRevalidate,
          data: { alt: `${def.alt} — still frame` },
          file: {
            data: posterData,
            mimetype: "image/png",
            name: def.posterName,
            size: posterData.length,
          },
        })

        const videoData = readFileSync(videoPath)
        const video = await payload.create({
          collection: "assets",
          context: noRevalidate,
          data: { alt: def.alt, poster: poster.id },
          file: {
            data: videoData,
            mimetype: "video/mp4",
            name: def.name,
            size: videoData.length,
          },
        })
        videoAssetIds[def.key] = video.id
        createdVideos++
      }
    } finally {
      rmSync(tmp, { recursive: true, force: true })
    }
    payload.logger.info(
      `Seeded ${createdVideos} new video asset(s) with ffmpeg (${videoDefs.length} total)`,
    )
  }

  const existingWorks = await payload.find({
    collection: "works",
    limit: 1,
  })

  // One table for both paths below — the fresh-seed creates and the Year
  // backfill — so a Work's Year can never drift between them.
  const workYears: Record<string, number> = {
    "solstice-denim-rebrand": 2024,
    "pulse-festival-identity": 2023,
    "atlas-museum-wayfinding": 2025,
    "fest-for-music": 2025,
  }

  if (existingWorks.docs.length === 0) {
    await payload.create({
      collection: "works",
      context: noRevalidate,
      data: {
        title: "Solstice Denim Rebrand",
        slug: "solstice-denim-rebrand",
        subtitle: "A denim house re-cut for the archive era",
        year: workYears["solstice-denim-rebrand"],
        thumbnail: assetIds.solsticeFeature,
        client: "Solstice",
        sector: sectorIds["Fashion"],
        associate: "Amara Diallo",
        expertise: ["Brand Identity", "Motion Design"],
        projectTeam: ["Jonas Weber", "Rin Takahashi"],
        collaborators: ["Studio Kite", "Marta Nunes"],
        testimonials: [
          {
            name: "Elena Marsh",
            job: "Creative Director",
            company: "Solstice",
            testimony:
              "Feugee rebuilt our brand without losing its history — the rollout was flawless.",
          },
        ],
        sections: [
          {
            title: "Challenges",
            layouts: [
              {
                blockType: "two-column",
                items: [
                  {
                    blockType: "title",
                    title: "Challenges we overcame",
                  },
                  {
                    blockType: "titled-text",
                    entries: [
                      {
                        title: "Challenge 1 — the art of time management",
                        text: lexicalParagraph(
                          "Forty years of archive, six weeks to catalogue it. We rotated three photographers through the collection so every garment was documented before the design phase began.",
                        ),
                      },
                      {
                        title: "Challenge 2 — the pressure of creativity",
                        text: lexicalParagraph(
                          "A rebrand this anticipated invites second-guessing. We locked the typographic system in week two and gave every later decision a deadline, keeping the team creating instead of circling.",
                        ),
                      },
                    ],
                  },
                ],
              },
              {
                blockType: "feature-left",
                items: [
                  { blockType: "asset", asset: assetIds.solsticeFeature },
                  { blockType: "asset", asset: assetIds.solsticeStationery },
                  { blockType: "asset", asset: assetIds.solsticeStorefront },
                ],
              },
            ],
          },
          {
            title: "Approach",
            layouts: [
              {
                blockType: "one-column",
                items: [
                  {
                    blockType: "text",
                    entries: [
                      {
                        text: lexicalParagraph(
                          "We treated the archive as the brief: every cut, label, and repair mark became raw material for the new identity.",
                        ),
                      },
                      {
                        text: lexicalParagraph(
                          "The wordmark's rhythm is lifted directly from the spacing of the original 1984 selvedge print — a detail collectors spotted within hours of launch.",
                        ),
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        _status: "published",
      },
    })

    await payload.create({
      collection: "works",
      context: noRevalidate,
      data: {
        title: "Pulse Festival Identity",
        slug: "pulse-festival-identity",
        subtitle: "A living identity for a three-day music festival",
        year: workYears["pulse-festival-identity"],
        // The video teaser doubles as the Thumbnail and a gallery Item when
        // ffmpeg generated it; image-only environments fall back.
        thumbnail: videoAssetIds.pulseTeaser ?? assetIds.pulseStageWide,
        client: "Pulse Festival",
        sector: sectorIds["Music"],
        associate: "Jonas Weber",
        expertise: ["Art Direction", "3D"],
        projectTeam: ["Amara Diallo"],
        collaborators: ["Field Recordings Co."],
        testimonials: [
          {
            name: "Tomas Reyes",
            job: "Festival Director",
            company: "Pulse",
            testimony: "Ticket sales opened and the posters had already gone viral.",
          },
        ],
        sections: [
          {
            title: "Gallery",
            layouts: [
              {
                blockType: "three-column",
                items: [
                  { blockType: "asset", asset: assetIds.pulsePoster1 },
                  { blockType: "asset", asset: assetIds.pulsePoster2 },
                  { blockType: "asset", asset: assetIds.pulsePoster3 },
                ],
              },
              {
                blockType: "two-column",
                items: [
                  {
                    blockType: "asset",
                    asset: videoAssetIds.pulseTeaser ?? assetIds.pulseStageWide,
                  },
                  { blockType: "asset", asset: assetIds.pulseStagePortrait },
                ],
              },
            ],
          },
        ],
        _status: "published",
      },
    })

    await payload.create({
      collection: "works",
      context: noRevalidate,
      data: {
        title: "Atlas Museum Wayfinding",
        slug: "atlas-museum-wayfinding",
        subtitle: "Wayfinding and digital guides for a reopened museum",
        year: workYears["atlas-museum-wayfinding"],
        client: "Atlas Museum",
        sector: sectorIds["Culture"],
        associate: "Rin Takahashi",
        expertise: ["Environmental Graphics", "Design Systems"],
        projectTeam: ["Amara Diallo", "Jonas Weber"],
        collaborators: ["Atlas Museum Digital Team"],
        _status: "draft",
      },
    })

    payload.logger.info("Seeded works: Solstice (sections), Pulse (gallery), Atlas Museum (draft)")
  } else {
    payload.logger.info("Works already exist — skipping work seed")
  }

  // ---- Works Years -------------------------------------------------------
  // Independent of the creates above: an older database can hold Works made
  // before Year mattered, and a Selected Works card without one shows no text
  // beside its title. Backfills only Works whose Year is still empty — an
  // editor-set Year always wins.
  const slugMatchedWorks = await payload.find({
    collection: "works",
    draft: false,
    limit: 0,
    where: { slug: { in: Object.keys(workYears) } },
  })

  for (const work of slugMatchedWorks.docs) {
    if (work.year != null) continue
    const year = workYears[work.slug ?? ""]
    if (year === undefined) continue
    await payload.update({
      collection: "works",
      id: work.id,
      context: noRevalidate,
      draft: false,
      data: { year },
    })
    payload.logger.info(`Seeded year ${year} on work "${work.title}"`)
  }

  // ---- Clients (the Client Marquee) ------------------------------------
  // Wordmark logos rendered from SVG text: the marquee silhouettes every logo
  // white at render time, so dark text on a transparent canvas is all a dummy
  // logo needs. Sharp's trim() cuts the transparent margins so spacing between
  // marquee items comes from the layout gap, not hidden padding.
  type ClientDef = {
    name: string
    wordmark: string
    font: string
    weight: number
    fontSize: number
    letterSpacing: number
    italic?: boolean
    url?: string
  }

  const clientDefs: ClientDef[] = [
    { name: "Solstice", wordmark: "SOLSTICE", font: "Noto Sans", weight: 400, fontSize: 64, letterSpacing: 18 },
    { name: "Pulse Festival", wordmark: "Pulse Festival", font: "Noto Sans", weight: 700, fontSize: 60, letterSpacing: 2 },
    { name: "Atlas Museum", wordmark: "Atlas Museum", font: "Noto Serif", weight: 400, fontSize: 60, letterSpacing: 6 },
    { name: "Northline Rail", wordmark: "NORTHLINE RAIL", font: "Noto Sans", weight: 700, fontSize: 54, letterSpacing: 10, url: "https://example.com" },
    { name: "Kestrel Coffee", wordmark: "kestrel coffee", font: "Noto Sans", weight: 700, fontSize: 60, letterSpacing: 4 },
    { name: "Mono Records", wordmark: "MONO RECORDS", font: "Noto Sans", weight: 400, fontSize: 58, letterSpacing: 14, url: "https://example.com" },
    { name: "Harbor Books", wordmark: "Harbor Books", font: "Noto Serif", weight: 400, fontSize: 60, letterSpacing: 2, italic: true },
    { name: "Vela Sport", wordmark: "VELA SPORT", font: "Noto Sans", weight: 700, fontSize: 58, letterSpacing: 8, italic: true },
  ]

  const wordmarkLogo = async (def: ClientDef) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="200">
    <text x="400" y="100" text-anchor="middle" dominant-baseline="central"
      font-family="${def.font}, sans-serif" font-weight="${def.weight}"
      font-style="${def.italic ? "italic" : "normal"}"
      font-size="${def.fontSize}" letter-spacing="${def.letterSpacing}"
      fill="#141414">${def.wordmark}</text>
  </svg>`
    return sharp(Buffer.from(svg)).trim().png().toBuffer()
  }

  const existingClients = await payload.find({
    collection: "clients",
    limit: 1,
  })

  if (existingClients.docs.length === 0) {
    for (const def of clientDefs) {
      const data = await wordmarkLogo(def)
      // Logos are Assets like every other image; Clients references them.
      const logo = await payload.create({
        collection: "assets",
        context: noRevalidate,
        data: { alt: `${def.name} wordmark logo` },
        file: {
          data,
          mimetype: "image/png",
          name: `logo-${def.name.toLowerCase().replace(/\s+/g, "-")}.png`,
          size: data.length,
        },
      })
      await payload.create({
        collection: "clients",
        context: noRevalidate,
        data: { name: def.name, url: def.url ?? null, logo: logo.id },
      })
    }
    payload.logger.info(`Seeded ${clientDefs.length} clients for the Client Marquee`)
  } else {
    payload.logger.info("Clients already exist — skipping client seed")
  }

  // Read the published state, not the draft — the stats are live content.
  const publishedLandingPage = await payload.findGlobal({
    slug: "landing-page",
    draft: false,
  })

  if ((publishedLandingPage.stats?.length ?? 0) === 0) {
    await payload.updateGlobal({
      slug: "landing-page",
      context: noRevalidate,
      draft: false,
      data: {
        // Without an explicit _status the saved version defaults to draft,
        // and the published read path would never see the stats.
        _status: "published",
        stats: [
          { value: "55+", label: "Videos" },
          { value: "35+M", label: "Views" },
        ],
      },
    })
    payload.logger.info('Seeded landing page stats: "55+ Videos", "35+M Views"')
  } else {
    payload.logger.info("Landing page stats already published — skipping stat seed")
  }

  // ---- Landing Page hero, Who We Are, and Selected Works ----------------
  // Re-read the published state: the stats block above may have just written
  // it, and this update passes every section explicitly.
  const landingNow = await payload.findGlobal({
    slug: "landing-page",
    draft: false,
  })

  if ((landingNow.hero?.slides?.length ?? 0) === 0) {
    const publishedWorks = await payload.find({
      collection: "works",
      depth: 0,
      draft: false,
      limit: 0,
      where: { _status: { equals: "published" } },
    })

    // Curated order: video-thumbnail works first for landing variety, then the
    // remaining published Works in CMS order.
    const preferredSlugs = [
      "pulse-festival-identity",
      "fest-for-music",
      "solstice-denim-rebrand",
    ]
    const idBySlug = new Map(
      publishedWorks.docs.map((work) => [work.slug ?? "", work.id]),
    )
    const selectedWorks = [
      ...preferredSlugs.flatMap((slug) => {
        const id = idBySlug.get(slug)
        return id !== undefined ? [id] : []
      }),
      ...publishedWorks.docs
        .filter((work) => !preferredSlugs.includes(work.slug ?? ""))
        .map((work) => work.id),
    ]

    // Hero slides are the ffmpeg gradient loops; image-only environments seed
    // no slides and the Hero stays hidden until real videos are uploaded.
    const heroSlides = (["heroEmber", "heroTide", "heroInk"] as const).flatMap(
      (key) => (videoAssetIds[key] ? [{ video: videoAssetIds[key] }] : []),
    )

    await payload.updateGlobal({
      slug: "landing-page",
      context: noRevalidate,
      draft: false,
      data: {
        // Without an explicit _status the saved version defaults to draft,
        // and the published read path would never see the content.
        _status: "published",
        hero: {
          title: "We're Feugee",
          subtitle: "Ambitious ideas for ambitious business",
          leadInWord: "Into",
          // No URL seeded — the cue demonstrates its default: scrolling to
          // the content below the Hero.
          scrollCue: { label: "Scroll to explore" },
          rotatingWords: [{ word: "Motion" }, { word: "Design" }, { word: "Experience" }],
          slides: heroSlides,
        },
        whoWeAre: {
          heading: "Who We Are",
          description:
            "Feugee is a creative agency for ambitious business. One team directs, designs, and builds — carrying films, identities, and campaigns from first sketch to final frame.",
        },
        stats: landingNow.stats ?? [],
        clientsHeading: "Clients Ideas We've Visualized",
        selectedWorks,
        selectedWorksHeading: "Selected Works",
      },
    })
    payload.logger.info(
      `Seeded landing page: ${heroSlides.length} hero slide(s), Who We Are copy, ${selectedWorks.length} selected work(s)`,
    )
  } else {
    payload.logger.info("Landing page hero already has slides — skipping landing content seed")
  }

  // ---- Landing Page hero rotating words -----------------------------------
  // Independent of the hero guard above: an older database can have hero slides
  // but no rotating words, and the title's second line renders only with them.
  const landingForRotatingWords = await payload.findGlobal({
    slug: "landing-page",
    draft: false,
  })

  if ((landingForRotatingWords.hero?.rotatingWords?.length ?? 0) === 0) {
    await payload.updateGlobal({
      slug: "landing-page",
      context: noRevalidate,
      draft: false,
      data: {
        _status: "published",
        // Partial update: title and slides stay as the editor left them.
        hero: {
          rotatingWords: [{ word: "Motion" }, { word: "Design" }, { word: "Experience" }],
        },
      },
    })
    payload.logger.info("Seeded landing page hero rotating words: Motion, Design, Experience")
  } else {
    payload.logger.info("Landing page hero already has rotating words — skipping word seed")
  }

  // ---- Landing Page CMS copy (lead-in word, Scroll Cue, headings) --------
  // Same independent-guard shape: an older database can predate the CMS copy
  // fields entirely. Backfills only what is still empty — an editor-set value
  // always wins. Partial update: untouched hero subfields stay as saved.
  const landingForCopy = await payload.findGlobal({
    slug: "landing-page",
    draft: false,
  })

  const heroCopy: Record<string, unknown> = {}
  if ((landingForCopy.hero?.leadInWord ?? "").trim() === "") {
    heroCopy.leadInWord = "Into"
  }
  if ((landingForCopy.hero?.scrollCue?.label ?? "").trim() === "") {
    // Carry any editor-set URL across — only the blank label is backfilled.
    heroCopy.scrollCue = {
      label: "Scroll to explore",
      url: landingForCopy.hero?.scrollCue?.url ?? null,
    }
  }

  const copyData: Record<string, unknown> = {}
  if (Object.keys(heroCopy).length > 0) copyData.hero = heroCopy
  if ((landingForCopy.clientsHeading ?? "").trim() === "") {
    copyData.clientsHeading = "Clients Ideas We've Visualized"
  }
  if ((landingForCopy.selectedWorksHeading ?? "").trim() === "") {
    copyData.selectedWorksHeading = "Selected Works"
  }

  if (Object.keys(copyData).length > 0) {
    copyData._status = "published"
    await payload.updateGlobal({
      slug: "landing-page",
      context: noRevalidate,
      draft: false,
      data: copyData,
    })
    payload.logger.info(
      `Seeded landing page CMS copy: ${Object.keys(copyData).filter((key) => key !== "_status").join(", ")}`,
    )
  } else {
    payload.logger.info("Landing page CMS copy already set — skipping copy seed")
  }

  // ---- Landing Page Testimonials ------------------------------------------
  // Same independent-guard shape as the rotating-words block above: an older
  // database can have hero slides but no testimonials, and the section renders
  // only with content, so it would silently stay hidden. Six samples so each
  // counter-scrolling column holds enough cards to scroll without gaps.
  const landingForTestimonials = await payload.findGlobal({
    slug: "landing-page",
    draft: false,
  })

  if ((landingForTestimonials.testimonials?.items?.length ?? 0) === 0) {
    await payload.updateGlobal({
      slug: "landing-page",
      context: noRevalidate,
      draft: false,
      data: {
        _status: "published",
        testimonials: {
          heading: "Testimonials",
          description:
            "What clients say after the final frame — endorsements from the brands we have built with.",
          items: [
            {
              name: "Emil Anton",
              job: "Marketing Director",
              company: "Fest",
              testimony:
                "Feugee turned a vague brief into a campaign people still quote back at us.",
            },
            {
              name: "Mara Lindqvist",
              job: "Brand Lead",
              company: "Solstice",
              testimony:
                "They move fast without ever making the work feel rushed.",
            },
            {
              name: "Daniel Okafor",
              job: "Founder",
              company: "Northlight",
              testimony:
                "One team from strategy to final frame — nothing got lost in between.",
            },
            {
              name: "Priya Raman",
              job: "CMO",
              company: "Tidepool",
              testimony:
                "Our launch film outperformed every benchmark we set. Doubled them, actually.",
            },
            {
              name: "Jonas Weber",
              job: "Head of Content",
              company: "Pulse",
              testimony:
                "The rare agency that listens first and shows off second.",
            },
            {
              name: "Alicia Gomez",
              job: "VP Marketing",
              company: "Kestrel",
              testimony:
                "Every review came back the same: this looks like a different company.",
            },
          ],
        },
      },
    })
    payload.logger.info("Seeded landing page testimonials: 6 agency endorsements")
  } else {
    payload.logger.info("Landing page already has testimonials — skipping testimonial seed")
  }

  // ---- Footer (site-wide chrome) ----------------------------------------
  // The sample Contact CTA, shared by the fresh-footer seed and the CTA
  // backfill below.
  const sampleCta = {
    eyebrow: "Free 20-min intro call",
    headline: "Tell us what you’re building",
    body: "Tell us about your goals and we will reply within a day with a clear scope and next steps.",
    actionLabel: "Work with us",
    // The secondary action demonstrates the URL-bearing second button.
    secondaryActionLabel: "See our works",
    secondaryActionUrl: "/works",
  }

  // Seed only a Footer the CMS has never saved (findGlobal returns a doc with
  // no id for one) — anything an editor has touched is theirs. Publish
  // explicitly: a drafts global saves as draft and the published read path
  // would never see the content.
  const existingFooter = await payload.findGlobal({
    slug: "footer",
    draft: false,
  })

  if (!existingFooter.id) {
    const publishedWorks = await payload.find({
      collection: "works",
      draft: false,
      limit: 3,
      where: { _status: { equals: "published" } },
    })

    await payload.updateGlobal({
      slug: "footer",
      context: noRevalidate,
      draft: false,
      data: {
        _status: "published",
        cta: sampleCta,
        about: {
          heading: "About",
          description:
            "We create thoughtful digital experiences that feel simple, human, and easy to love. From the little details to the bigger picture, everything is designed with care to make everyday moments feel a little more effortless",
        },
        otherWorksHeading: "Other Works",
        otherWorks: publishedWorks.docs.map((work) => work.id),
        menuHeading: "Menu",
        menuLinks: [
          { label: "Home", url: "/" },
          { label: "Works", url: "/works" },
        ],
        contact: {
          heading: "Contact Us",
          callToAction: "Book a Call",
          email: "feugeestudio@gmail.com",
          phone: "+1 (123) 456-7890",
        },
        location: "Malang, Indonesia",
        // Placeholder handles — the Agency swaps in the real profiles.
        socialLinks: [
          { platform: "facebook", url: "https://www.facebook.com/feugeestudio" },
          { platform: "instagram", url: "https://www.instagram.com/feugeestudio" },
          { platform: "x", url: "https://x.com/feugeestudio" },
          { platform: "behance", url: "https://www.behance.net/feugeestudio" },
          { platform: "linkedin", url: "https://www.linkedin.com/company/feugeestudio" },
          { platform: "pinterest", url: "https://www.pinterest.com/feugeestudio" },
          { platform: "dribbble", url: "https://dribbble.com/feugeestudio" },
          { platform: "contra", url: "https://contra.com/feugeestudio" },
        ],
        copyrightName: "Feugee",
      },
    })
    payload.logger.info(
      `Seeded footer: about, ${publishedWorks.docs.length} other work(s), menu, contact`,
    )
  } else {
    payload.logger.info("Footer already has content — skipping footer seed")
  }

  // ---- Footer Contact CTA (moved from the Landing Page global) -----------
  // The Contact CTA lives on the Footer global now. A database seeded before
  // the move still holds its content under the landing global, where the field
  // no longer exists — read it through a cast and copy it across. Fresh
  // databases got the sample CTA from the footer seed above.
  const footerForCta = await payload.findGlobal({
    slug: "footer",
    draft: false,
  })

  if ((footerForCta.cta?.headline ?? "").trim() === "") {
    const landingRaw = await payload.findGlobal({
      slug: "landing-page",
      draft: false,
    })
    const storedCta = (landingRaw as { contactCta?: Record<string, string> })
      .contactCta

    await payload.updateGlobal({
      slug: "footer",
      context: noRevalidate,
      draft: false,
      data: {
        _status: "published",
        cta: storedCta ?? sampleCta,
      },
    })
    payload.logger.info(
      storedCta
        ? "Migrated landing page Contact CTA into the footer"
        : "Seeded footer Contact CTA",
    )
  } else {
    payload.logger.info("Footer already has a Contact CTA — skipping CTA seed")
  }
}
