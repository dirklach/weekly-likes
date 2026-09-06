export type Author = {
  _id: string
  name: string
  url: string | null
}

export type Category = {
  _id: string
  name: string
}

export type PickImage = {
  alt?: string | null
  asset?: {
    _ref: string
    _type: string
  } | null
}

export type EditionPick = {
  _key: string
  title: string
  url: string
  authors: Author[] | null
  category: Category | null
  image: PickImage | null
}

export type Edition = {
  _id: string
  number: string
  picks: EditionPick[] | null
}
