const CDN = "https://cdn.sanity.io/images"

export function parseAssetId(assetId: string) {
  const parts = assetId.split("-").slice(1)
  if (parts.length < 2) return null

  const format = parts.pop()
  const dimensionPart = parts.pop()
  const match = dimensionPart?.match(/^(\d+)x(\d+)$/)
  if (!format || !match) return null

  return {
    hash: parts.join("-"),
    width: Number(match[1]),
    height: Number(match[2]),
    format,
  }
}

export function sanityImageUrl(
  assetId: string,
  projectId: string,
  dataset: string,
  width: number,
) {
  const parsed = parseAssetId(assetId)
  if (!parsed) return ""

  const params = new URLSearchParams({
    auto: "format",
    fit: "max",
    q: "75",
    w: String(Math.min(width, parsed.width)),
  })

  return `${CDN}/${projectId}/${dataset}/${parsed.hash}-${parsed.width}x${parsed.height}.${parsed.format}?${params}`
}
