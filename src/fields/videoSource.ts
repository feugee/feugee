import sharp from "sharp";
import type { Field, FieldHook, PayloadRequest } from "payload";

/**
 * The Video Source field (CONTEXT.md): the either/or every video-consuming
 * field presents — an uploaded video Asset or an Embedded Video. Exactly one
 * is set, never both. YouTube is the only provider wired up, but the data
 * carries the provider so adding another (Vimeo, …) needs no schema change.
 */

type UploadFilterOptions = Extract<Field, { type: "upload" }>["filterOptions"];

export type VideoSourceFieldOptions = {
  /** The field name at its site — `video`, `thumbnail`, `featureVisual`, `asset`. */
  name: string;
  label?: string;
  /** A video must resolve to one source — the old upload field's `required`. */
  required?: boolean;
  /** The upload branch's mime filter, carried over verbatim from the site. */
  assetFilterOptions?: UploadFilterOptions;
  /** What the upload branch means at this site, shown under the field. */
  assetDescription?: string;
};

// --- YouTube URL / ID parsing ---------------------------------------------

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * The canonical 11-character video ID from anything an editor pastes — a
 * bare ID or any of YouTube's own URL shapes (watch links, youtu.be,
 * shorts, embed, live; www/m/music/nocookie hosts). Null when nothing
 * recognizable.
 */
export const youtubeVideoIdOf = (input: string): string | null => {
  const trimmed = input.trim();
  if (YOUTUBE_ID.test(trimmed)) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.replace(/^(www|m|music)\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id !== undefined && YOUTUBE_ID.test(id) ? id : null;
  }
  if (host !== "youtube.com" && host !== "youtube-nocookie.com") return null;

  const fromQuery = url.searchParams.get("v");
  if (fromQuery !== null && YOUTUBE_ID.test(fromQuery)) return fromQuery;

  const [prefix, id] = url.pathname.split("/").filter(Boolean);
  const pathful =
    prefix === "shorts" || prefix === "embed" || prefix === "live";
  return pathful && id !== undefined && YOUTUBE_ID.test(id) ? id : null;
};

// --- Validation ------------------------------------------------------------

type EmbedValue = {
  provider?: string | null;
  url?: string | null;
  alt?: string | null;
  videoId?: string | null;
  poster?: unknown;
};

type VideoSourceValue = {
  source?: string | null;
  asset?: unknown;
  embed?: EmbedValue | null;
};

const embedUrlOf = (value: VideoSourceValue): string => {
  const url = value.embed?.url;
  return typeof url === "string" ? url.trim() : "";
};

/**
 * The one place that enforces the Video Source contract: a video is either
 * an upload or an embed — never both, and (when required) never neither.
 * The embed branch must carry a recognizable YouTube reference and alt
 * text, matching the alt every uploaded Asset already requires.
 */
export const videoSourceValidate =
  (required: boolean) =>
  (value: unknown): true | string => {
    if (value == null || typeof value !== "object") {
      return required
        ? "Choose an uploaded video or paste a YouTube URL."
        : true;
    }
    const group = value as VideoSourceValue;
    const embedUrl = embedUrlOf(group);

    if (group.source === "embed") {
      if (group.asset != null) {
        return "An uploaded Asset is still chosen — clear it to use a YouTube video.";
      }
      if (embedUrl === "") {
        return required ? "Paste the YouTube video's URL or ID." : true;
      }
      if (youtubeVideoIdOf(embedUrl) === null) {
        return "That does not look like a YouTube URL or video ID.";
      }
      const alt = group.embed?.alt;
      if (typeof alt !== "string" || alt.trim() === "") {
        return "Describe the video for screen readers (Alt text).";
      }
      return true;
    }

    if (embedUrl !== "") {
      return "A YouTube URL is still set — clear it to use an uploaded Asset.";
    }
    if (group.asset == null) {
      return required ? "Choose an uploaded video." : true;
    }
    return true;
  };

// --- Poster ingestion ------------------------------------------------------

const POSTER_FETCH_TIMEOUT_MS = 10_000;

/**
 * YouTube's own thumbnail for the video, ingested as an ordinary image
 * Asset so the Poster keeps both its jobs — preview frame and aspect-ratio
 * carrier (CONTEXT.md). maxresdefault is 1280×720; hqdefault (480×360)
 * covers videos with no HD source and arrives letterboxed to 4:3, so the
 * crop strips the bars — otherwise a 16:9 video's poster would lie about
 * its shape in the masonry and Layouts. Null when YouTube serves neither
 * (bad ID, offline): the save proceeds posterless rather than failing.
 */
const ingestYoutubePoster = async (
  videoId: string,
  alt: string,
  req: PayloadRequest,
): Promise<number | null> => {
  for (const variant of ["maxresdefault", "hqdefault"] as const) {
    const response = await fetch(
      `https://i.ytimg.com/vi/${videoId}/${variant}.jpg`,
      { signal: AbortSignal.timeout(POSTER_FETCH_TIMEOUT_MS) },
    );
    if (!response.ok) continue;

    const original = Buffer.from(await response.arrayBuffer());
    const metadata = await sharp(original).metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    let data = original;

    if (
      width > 0 &&
      height > 0 &&
      Math.abs(width / height - 4 / 3) < 0.02 &&
      Math.abs(width / height - 16 / 9) > 0.02
    ) {
      const target = Math.round((width * 9) / 16);
      data = await sharp(original)
        .extract({
          left: 0,
          top: Math.floor((height - target) / 2),
          width,
          height: target,
        })
        .jpeg({ quality: 90 })
        .toBuffer();
    }

    const asset = await req.payload.create({
      collection: "assets",
      data: { alt },
      file: {
        data,
        mimetype: "image/jpeg",
        name: `youtube-${videoId}-${variant}.jpg`,
        size: data.length,
      },
      req,
    });
    return typeof asset.id === "number" ? asset.id : null;
  }
  return null;
};

// --- Normalization hook ----------------------------------------------------

/**
 * Derives the canonical video ID from the pasted URL and keeps the Poster
 * in step: a changed video — or a first save with no poster yet — ingests
 * YouTube's thumbnail as an image Asset. An unchanged embed passes through
 * untouched, and uploaded saves never fetch at all, so autosave stays
 * cheap. Threading `req` keeps the ingest inside the save's transaction.
 */
const normalizeVideoSource: FieldHook = async ({
  value,
  previousValue,
  req,
}) => {
  const group = value as VideoSourceValue | null | undefined;
  if (group == null || group.source !== "embed") return value;

  const embed = group.embed ?? {};
  const pasted = typeof embed.url === "string" ? embed.url.trim() : "";
  const videoId = pasted !== "" ? youtubeVideoIdOf(pasted) : null;

  // An unparseable URL never reaches this hook — validation rejects it
  // first — so null here means an empty URL on an optional field: no embed.
  if (videoId === null) {
    return { ...group, embed: { ...embed, videoId: null } };
  }

  const previousVideoId =
    (previousValue as VideoSourceValue | null | undefined)?.embed?.videoId ??
    null;
  const hasPoster =
    typeof embed.poster === "number" ||
    (typeof embed.poster === "object" && embed.poster !== null);

  let poster = embed.poster;
  if (!hasPoster || previousVideoId !== videoId) {
    const alt =
      typeof embed.alt === "string" && embed.alt.trim() !== ""
        ? embed.alt.trim()
        : `YouTube video ${videoId}`;
    try {
      const posterId = await ingestYoutubePoster(videoId, alt, req);
      if (posterId !== null) poster = posterId;
    } catch (error) {
      req.payload.logger.warn(
        `YouTube poster ingest failed for ${videoId} — saving without one: ${String(error)}`,
      );
    }
  }

  return { ...group, embed: { ...embed, videoId, poster } };
};

// --- The field factory -----------------------------------------------------

export const videoSourceField = (
  options: VideoSourceFieldOptions,
): Field => {
  const {
    name,
    label,
    required = false,
    assetFilterOptions,
    assetDescription,
  } = options;

  return {
    name,
    type: "group",
    ...(label !== undefined ? { label } : {}),
    fields: [
      {
        name: "source",
        type: "radio",
        label: "Source",
        options: [
          { label: "Uploaded Asset", value: "asset" },
          { label: "YouTube", value: "embed" },
        ],
        defaultValue: "asset",
        admin: { layout: "horizontal" },
      },
      {
        name: "asset",
        type: "upload",
        relationTo: "assets",
        filterOptions: assetFilterOptions,
        admin: {
          condition: (_data, sibling) =>
            (sibling as VideoSourceValue | undefined)?.source !== "embed",
          ...(assetDescription !== undefined ? { description: assetDescription } : {}),
        },
      },
      {
        name: "embed",
        type: "group",
        label: "YouTube Video",
        admin: {
          condition: (_data, sibling) =>
            (sibling as VideoSourceValue | undefined)?.source === "embed",
          description:
            "An external video referenced by URL instead of an upload — long videos without storage cost. Plays on the public site like any video: muted, looping, without controls.",
        },
        fields: [
          {
            name: "provider",
            type: "select",
            label: "Provider",
            options: [{ label: "YouTube", value: "youtube" }],
            defaultValue: "youtube",
            required: true,
            admin: {
              description:
                "YouTube is the first provider; the storage shape already carries any other.",
            },
          },
          {
            name: "url",
            type: "text",
            label: "YouTube URL or video ID",
            admin: {
              description:
                "Paste the video's address (watch link, youtu.be, shorts) or its 11-character ID.",
            },
          },
          {
            name: "alt",
            type: "text",
            label: "Alt text",
            admin: {
              description:
                "Describes the video for screen readers and search engines.",
            },
          },
          {
            name: "videoId",
            type: "text",
            label: "Video ID",
            admin: {
              readOnly: true,
              description:
                "Derived from the URL on save — the public player embeds by this.",
            },
          },
          {
            name: "poster",
            type: "upload",
            relationTo: "assets",
            filterOptions: () => ({ mimeType: { like: "image/" } }),
            admin: {
              description:
                "Ingested from YouTube on save; replace it to override the preview frame and the aspect ratio it carries.",
            },
          },
        ],
      },
    ],
    validate: videoSourceValidate(required),
    hooks: { beforeChange: [normalizeVideoSource] },
  };
};
