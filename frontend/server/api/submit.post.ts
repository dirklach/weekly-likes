const isHttpUrl = (value: unknown): value is string => {
  if (typeof value !== 'string' || value.length > 2048) return false
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const clean = (value: unknown, max = 200) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const workUrl = clean(body?.workUrl, 2048)
  const submitterName = clean(body?.submitterName)
  const submitterEmail = clean(body?.submitterEmail)
  const authors = (Array.isArray(body?.authors) ? body.authors : [])
    .map((author: any) => ({name: clean(author?.name), website: clean(author?.website, 2048)}))
    .filter((author: {name: string}) => author.name)
    .slice(0, 10) as {name: string; website: string}[]

  const errors: Record<string, string> = {}
  if (!isHttpUrl(workUrl)) errors.workUrl = 'Please enter a valid URL (https://…)'
  if (!submitterName) errors.submitterName = 'Please enter your name'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterEmail)) {
    errors.submitterEmail = 'Please enter a valid email address'
  }
  if (!authors.length) errors.authors = 'Please name at least one author'
  authors.forEach((author, index) => {
    if (author.website && !isHttpUrl(author.website)) {
      errors[`authors.${index}.website`] = 'Please enter a valid URL (https://…)'
    }
  })
  if (Object.keys(errors).length) {
    throw createError({statusCode: 400, message: 'Please check the form', data: {errors}})
  }

  const config = getSubmissionConfig(event)
  if (!config.lemonsqueezyApiKey || !config.lemonsqueezyStoreId || !config.lemonsqueezyVariantId) {
    throw createError({statusCode: 500, message: 'Payments are not configured'})
  }

  const {results} = await sanityMutate(config.sanityWriteToken, [
    {
      create: {
        _type: 'submission',
        workUrl,
        submitterName,
        submitterEmail,
        authors: authors.map(({name, website}, index) => ({
          _key: `author${index}`,
          _type: 'submissionAuthor',
          name,
          ...(website ? {website} : {}),
        })),
        status: 'pending',
        submittedAt: new Date().toISOString(),
      },
    },
  ])
  const submissionId = results[0]?.id
  if (!submissionId) {
    throw createError({statusCode: 500, message: 'Could not save submission'})
  }

  const origin = useRuntimeConfig(event).public.siteUrl || getRequestURL(event).origin

  // The 10 EUR price lives on the Lemon Squeezy variant.
  const checkout = await $fetch<{data: {attributes: {url: string}}}>(
    'https://api.lemonsqueezy.com/v1/checkouts',
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${config.lemonsqueezyApiKey}`,
      },
      body: {
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: submitterEmail,
              name: submitterName,
              custom: {submission_id: submissionId},
            },
            product_options: {
              redirect_url: `${origin}/submit/success`,
            },
          },
          relationships: {
            store: {data: {type: 'stores', id: String(config.lemonsqueezyStoreId)}},
            variant: {data: {type: 'variants', id: String(config.lemonsqueezyVariantId)}},
          },
        },
      },
    },
  ).catch(() => {
    throw createError({statusCode: 502, message: 'Could not start checkout'})
  })

  return {url: checkout.data.attributes.url}
})
