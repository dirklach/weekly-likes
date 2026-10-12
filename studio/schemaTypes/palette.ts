import {defineArrayMember, defineField, defineType} from 'sanity'

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

// A color combination on /colors; the page filters by how many colors it has (2, 3 or 4).
export const paletteType = defineType({
  name: 'palette',
  title: 'Color Palette',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      description: 'Optional, e.g. what the colors were taken from.',
    }),
    defineField({
      name: 'colors',
      type: 'array',
      description: 'Two to four colors as hex codes (#RRGGBB), in display order.',
      of: [
        defineArrayMember({
          type: 'string',
          validation: (rule) =>
            rule.required().regex(HEX_COLOR, {name: 'hex color'}).error('Use #RRGGBB, e.g. #1A2B3C'),
        }),
      ],
      validation: (rule) => rule.required().min(2).max(4),
    }),
    defineField({
      name: 'credit',
      type: 'object',
      description: 'Optional: who made the work these colors come from.',
      fields: [
        defineField({name: 'name', type: 'string'}),
        defineField({
          name: 'url',
          type: 'url',
          validation: (rule) =>
            rule.uri({scheme: ['http', 'https']}).error('Must start with http:// or https://'),
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'title', colors: 'colors', credit: 'credit.name'},
    prepare({title, colors, credit}) {
      const hexes = (colors as string[] | undefined)?.join(' ') || 'No colors'
      return {title: title || hexes, subtitle: [title ? hexes : null, credit].filter(Boolean).join(' · ')}
    },
  },
  orderings: [{title: 'Newest', name: 'createdDesc', by: [{field: '_createdAt', direction: 'desc'}]}],
})
