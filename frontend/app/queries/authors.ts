import {defineQuery} from "groq"

// Only authors credited on at least one published pick.
export const AUTHORS_QUERY = defineQuery(/* groq */ `
  *[_type == "author" && _id in *[_type == "edition"].picks[].authors[]._ref] | order(lower(name) asc) {
    _id,
    name,
    url
  }
`)
