import {FONTS_QUERY} from "~/queries/fonts"
import type {Font} from "~/types/content"

export function useFonts() {
  return useSanityQuery<Font[]>(FONTS_QUERY, undefined, {
    key: "fonts",
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key],
  })
}
