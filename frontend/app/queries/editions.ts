import {defineQuery} from "groq"

const pickProjection = /* groq */ `
  _key,
  title,
  url,
  "authors": coalesce(
    authors[defined(@->_id)]->{_id, name, url},
    select(defined(author) => [author->{_id, name, url}])
  ),
  category->{
    _id,
    name
  },
  image {
    alt,
    asset
  }
`

export const EDITIONS_QUERY = defineQuery(/* groq */ `
  *[_type == "edition" && defined(number)] | order(number desc) {
    _id,
    number,
    picks[] {
      ${pickProjection}
    }
  }
`)
