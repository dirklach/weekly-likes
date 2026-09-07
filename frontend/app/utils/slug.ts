import type {Edition, EditionPick} from "~/types/content"

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function pickSlug(picks: EditionPick[], pick: EditionPick) {
  const seen = new Map<string, number>()

  for (const item of picks) {
    const base = slugify(item.title) || item._key
    const count = (seen.get(base) ?? 0) + 1
    seen.set(base, count)
    const slug = count === 1 ? base : `${base}-${count}`
    if (item._key === pick._key) return slug
  }

  return slugify(pick.title) || pick._key
}

export function pickHref(edition: Edition, pick: EditionPick) {
  return `/${edition.number}/${pickSlug(edition.picks || [], pick)}`
}
