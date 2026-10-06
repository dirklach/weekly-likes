import {defineQuery} from "groq"

export const FONTS_QUERY = defineQuery(/* groq */ `
  *[_type == "font" && defined(slug.current)] | order(lower(name) asc) {
    _id,
    name,
    "slug": slug.current,
    category,
    license,
    url,
    foundry->{
      _id,
      name,
      url
    },
    "preview": preview.asset->{
      url,
      "width": metadata.dimensions.width,
      "height": metadata.dimensions.height
    }
  }
`)
