import {PALETTES_QUERY} from "~/queries/palettes"
import type {Palette} from "~/types/content"

export function usePalettes() {
  return useSanityQuery<Palette[]>(PALETTES_QUERY, undefined, {
    key: "palettes",
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key],
  })
}
