import configPromise from "@payload-config"
import { notFound } from "next/navigation"
import { cache } from "react"
import { getPayload } from "payload"

import { publishedWhere } from "@/access/publishedRead"
import type { Work } from "@/payload-types"
import { videoSourceOgOf } from "@/seo/ogImage"
import { pageMetadata } from "@/seo/metadata"

import { WorkDetail } from "./WorkDetail"

// The page renders statically — revalidated by the Works hooks on publish —
// so it reads published Works only. Drafts preview inside the CMS Dashboard
// at /works/[slug]/preview.
const getWork = cache(async (slug: string): Promise<Work | null> => {
  const payload = await getPayload({ config: configPromise })
  const works = await payload.find({
    collection: "works",
    where: {
      and: [{ slug: { equals: slug } }, publishedWhere],
    },
    draft: false,
    // Depth 2 populates the Thumbnail and, in turn, its Poster — the OG image
    // stands a video Thumbnail in via that Poster.
    depth: 2,
    limit: 1,
  })
  return works.docs[0] ?? null
})

// Prerender every published Work at build; one published later renders on
// first request and is served from cache afterwards.
export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const works = await payload.find({
    collection: "works",
    draft: false,
    limit: 0,
    where: publishedWhere,
    depth: 0,
    select: { slug: true },
  })
  return works.docs.flatMap((work) =>
    typeof work.slug === "string" ? [{ slug: work.slug }] : [],
  )
}

export default async function Page({ params }: PageProps<"/works/[slug]">) {
  const { slug } = await params
  const work = await getWork(slug)
  if (!work) notFound()
  return <WorkDetail data={work} />
}

export async function generateMetadata({ params }: PageProps<"/works/[slug]">) {
  const { slug } = await params
  const work = await getWork(slug)
  if (!work) return pageMetadata({ title: "Work — Feugee" })

  return pageMetadata({
    title: `${work.title} — Feugee`,
    description: work.subtitle,
    url: `/works/${work.slug}`,
    image: videoSourceOgOf(work.thumbnail),
  })
}
