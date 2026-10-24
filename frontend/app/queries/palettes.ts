import {defineQuery} from "groq"

export const PALETTES_QUERY = defineQuery(/* groq */ `
  *[_type == "palette" && defined(number) && count(colors) >= 2] | order(number desc) {
    _id,
    number,
    // Color picker values ({hex, …}); palettes not yet migrated still hold plain hex strings.
    "colors": select(count(colors[_type == "color"]) > 0 => colors[].hex, colors)
  }
`)
