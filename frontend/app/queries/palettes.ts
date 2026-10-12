import {defineQuery} from "groq"

export const PALETTES_QUERY = defineQuery(/* groq */ `
  *[_type == "palette" && defined(number) && count(colors) >= 2] | order(number desc) {
    _id,
    number,
    colors
  }
`)
