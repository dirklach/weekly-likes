import {createHmac, timingSafeEqual} from 'node:crypto'

export default defineEventHandler(async (event) => {
  const {lemonsqueezyWebhookSecret, sanityWriteToken} = getSubmissionConfig(event)
  const signature = getHeader(event, 'x-signature') || ''
  const rawBody = await readRawBody(event, false)

  if (!signature || !rawBody || !lemonsqueezyWebhookSecret) {
    throw createError({statusCode: 400, message: 'Invalid webhook request'})
  }

  const expected = Buffer.from(
    createHmac('sha256', lemonsqueezyWebhookSecret).update(rawBody).digest('hex'),
    'utf8',
  )
  const received = Buffer.from(signature, 'utf8')
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    throw createError({statusCode: 400, message: 'Invalid signature'})
  }

  const payload = JSON.parse(rawBody.toString('utf8'))
  const submissionId = payload?.meta?.custom_data?.submission_id

  if (
    payload?.meta?.event_name === 'order_created' &&
    payload?.data?.attributes?.status === 'paid' &&
    typeof submissionId === 'string'
  ) {
    await sanityMutate(sanityWriteToken, [
      {
        patch: {
          // Only move pending submissions forward; never undo a review decision.
          query: '*[_type == "submission" && _id == $id && status == "pending"]',
          params: {id: submissionId},
          set: {status: 'paid', paymentId: String(payload.data.id)},
        },
      },
    ])
  }

  return {received: true}
})
