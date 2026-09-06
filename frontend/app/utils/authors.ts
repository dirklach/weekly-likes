import type {EditionPick} from "~/types/content"

export function authorNames(pick: EditionPick) {
  return pick.authors?.map((author) => author.name).filter(Boolean).join(", ") ?? ""
}
