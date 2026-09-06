import {defineArrayMember, defineField, defineType} from 'sanity'

export const pickType = defineType({
  name: 'pick',
  title: 'Pick',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'authors',
      title: 'By',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'author'}]})],
      validation: (rule) =>
        rule.required().min(1).error('Add at least one author').unique(),
    }),
    defineField({
      name: 'category',
      type: 'reference',
      to: [{type: 'category'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alternative text',
          validation: (rule) => rule.warning('Add alt text for accessibility'),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (rule) =>
        rule
          .required()
          .uri({scheme: ['http', 'https']})
          .error('Must start with http:// or https://'),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      author0: 'authors.0.name',
      author1: 'authors.1.name',
      author2: 'authors.2.name',
      media: 'image',
    },
    prepare({title, author0, author1, author2, media}) {
      const by = [author0, author1, author2].filter(Boolean).join(', ')
      return {title, subtitle: by, media}
    },
  },
})
