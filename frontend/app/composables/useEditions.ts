import {EDITIONS_QUERY} from "~/queries/editions"
import type {Edition} from "~/types/content"

export function useEditions() {
  return useSanityQuery<Edition[]>(EDITIONS_QUERY, undefined, {
    key: "editions",
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key],
  })
}
