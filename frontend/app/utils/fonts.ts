import type {Font} from "~/types/content"

// Alphabetical, ignoring case and accents (Söhne sits between Slussen and Suisse).
export function sortFontsByName(fonts: Font[]) {
  return [...fonts].sort((a, b) =>
    a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
  )
}
