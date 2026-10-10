// Canonical origin; aetyc.com redirects here.
export const SITE_URL = "https://www.aetyc.com"
export const SITE_NAME = "Aetyc"
export const SITE_TITLE = "Aetyc | Weekly Design Inspiration by Dirk Lach"
export const SITE_DESCRIPTION =
  "Aetyc explores visual culture: Weekly Likes delivers three hand-picked works in design, art, architecture, and photography every Friday, alongside a curated collection of fonts."

// First pick of week 051 (Rik Oostenbroek), used wherever a page has no image of its own.
const DEFAULT_OG_ASSET = "image-bd887af4fbe34cccb5353aca0d580a5a310076d9-1636x920-jpg"

const OG_PARAMS = "w=1200&h=630&fit=fill&bg=efefef"

export function absoluteUrl(path: string) {
  const clean = path.replace(/\/+$/, "")
  return `${SITE_URL}${clean || "/"}`
}

// 1200x630 share image on the grey image background, padded like the pick image boxes.
export function ogImageFromAsset(assetId: string) {
  const parsed = parseAssetId(assetId)
  if (!parsed) return ""
  return `https://cdn.sanity.io/images/bl19dtug/production/${parsed.hash}-${parsed.width}x${parsed.height}.${parsed.format}?${OG_PARAMS}&pad=32&fm=jpg&q=80`
}

// Font previews are SVG wordmarks, which social cards can't show; Sanity rasterises them.
export function ogImageFromSvgUrl(url: string) {
  return `${url}?${OG_PARAMS}&pad=180&fm=png`
}

export const DEFAULT_OG_IMAGE = ogImageFromAsset(DEFAULT_OG_ASSET)
