import {defineField, defineType} from 'sanity'

export const submissionType = defineType({
  name: 'submission',
  title: 'Submission',
  type: 'document',
  fields: [
    defineField({
      name: 'workUrl',
      title: 'Work URL',
      type: 'url',
      validation: (rule) => rule.required().uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'submitterName',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'submitterEmail',
      type: 'string',
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: 'authorNames',
      type: 'array',
      of: [{type: 'string'}],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'authorWebsite',
      type: 'url',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'status',
      type: 'string',
      initialValue: 'pending',
      options: {
        list: [
          {title: 'Pending payment', value: 'pending'},
          {title: 'Paid', value: 'paid'},
          {title: 'Accepted', value: 'accepted'},
          {title: 'Rejected', value: 'rejected'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'paymentId',
      title: 'Payment ID (Lemon Squeezy order)',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'submittedAt',
      type: 'datetime',
      readOnly: true,
    }),
  ],
  orderings: [
    {title: 'Newest', name: 'submittedAtDesc', by: [{field: 'submittedAt', direction: 'desc'}]},
  ],
  preview: {
    select: {title: 'workUrl', subtitle: 'status', name: 'submitterName'},
    prepare: ({title, subtitle, name}) => ({title, subtitle: `${subtitle} · ${name}`}),
  },
})
