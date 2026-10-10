type MaybeGetter = string | (() => string)

// Title, description and share image for a page; anything left out falls back to the
// site-wide defaults set in app.vue.
export function usePageSeo(meta: {
  title?: MaybeGetter
  description?: MaybeGetter
  image?: MaybeGetter
}) {
  useSeoMeta({
    ...(meta.title
      ? { title: meta.title, ogTitle: meta.title, twitterTitle: meta.title }
      : {}),
    ...(meta.description
      ? {
          description: meta.description,
          ogDescription: meta.description,
          twitterDescription: meta.description,
        }
      : {}),
    ...(meta.image ? { ogImage: meta.image, twitterImage: meta.image } : {}),
  })
}
