import type {H3Event} from 'h3'

const SANITY_PROJECT_ID = 'bl19dtug'
const SANITY_DATASET = 'production'
const SANITY_API_VERSION = '2024-03-25'

export function getSubmissionConfig(event: H3Event) {
  const config = useRuntimeConfig(event)
  return {
    lemonsqueezyApiKey: config.lemonsqueezyApiKey,
    lemonsqueezyStoreId: config.lemonsqueezyStoreId,
    lemonsqueezyVariantId: config.lemonsqueezyVariantId,
    lemonsqueezyWebhookSecret: config.lemonsqueezyWebhookSecret,
    sanityWriteToken: config.sanityWriteToken,
  }
}

// Minimal Sanity mutation helper (the @nuxtjs/sanity client is read-only/CDN).
export async function sanityMutate(token: string, mutations: Record<string, unknown>[]) {
  if (!token) {
    throw createError({statusCode: 500, message: 'Submissions are not configured'})
  }
  return $fetch<{results: {id: string}[]}>(
    `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/mutate/${SANITY_DATASET}`,
    {
      method: 'POST',
      headers: {Authorization: `Bearer ${token}`},
      query: {returnIds: true},
      body: {mutations},
    },
  )
}
