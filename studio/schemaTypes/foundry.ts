import {defineField, defineType} from 'sanity'

export const foundryType = defineType({
  name: 'foundry',
  title: 'Foundry',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'Website',
      type: 'url',
      validation: (rule) =>
        rule.uri({scheme: ['http', 'https']}).error('Must start with http:// or https://'),
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'url'},
  },
  orderings: [
    {title: 'Name', name: 'nameAsc', by: [{field: 'name', direction: 'asc'}]},
  ],
})
