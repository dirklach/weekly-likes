import {EDITIONS_QUERY} from '../../app/queries/editions'
import {pickHref} from '../../app/utils/slug'
import type {Edition} from '../../app/types/content'

const SITE_URL = 'https://www.aetyc.com'

const STATIC_PATHS = [
  '/',
  '/weekly',
  '/weekly/authors',
  '/weekly/infinity',
  '/weekly/focus',
  '/fonts',
  '/info',
  '/submit',
  '/imprint',
  '/privacy',
]

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

export default defineEventHandler(async (event) => {
  const {client} = useSanity(event)
  const [editions, fontSlugs] = await Promise.all([
    client.fetch<Edition[]>(EDITIONS_QUERY),
    client.fetch<string[]>(`*[_type == "font" && defined(slug.current)].slug.current`),
  ])

  // Same slugs as the pages themselves, so duplicate pick titles resolve identically.
  const paths = [
    ...STATIC_PATHS,
    ...editions.flatMap((edition) =>
      (edition.picks || []).map((pick) => pickHref(edition, pick)),
    ),
    ...fontSlugs.map((slug) => `/fonts/${slug}`),
  ]

  const urls = paths
    .map((path) => `  <url><loc>${escapeXml(`${SITE_URL}${path === '/' ? '/' : path}`)}</loc></url>`)
    .join('\n')

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
})
