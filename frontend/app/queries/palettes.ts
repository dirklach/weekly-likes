import {defineQuery} from "groq"

export const PALETTES_QUERY = defineQuery(/* groq */ `
  *[_type == "palette" && count(colors) >= 2] | order(_createdAt desc) {
    _id,
    title,
    colors,
    credit
  }
`)
