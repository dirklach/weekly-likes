export default defineEventHandler(async (event) => {
  const {query, params = {}, options} = await readBody(event)
  const sanity = useSanity(event)

  return sanity.client.fetch(query, params, options)
})
