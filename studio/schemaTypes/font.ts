import {defineField, defineType} from 'sanity'

// Serif and Sans Serif get their own filter on /fonts, everything else is listed under "Other".
export const FONT_CATEGORIES = ['Serif', 'Sans Serif', 'Display', 'Script', 'Monospace', 'Other']

export const fontType = defineType({
  name: 'font',
  title: 'Font',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'name'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      type: 'string',
      options: {list: FONT_CATEGORIES, layout: 'radio', direction: 'horizontal'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'license',
      type: 'string',
      options: {list: ['Commercial', 'Free'], layout: 'radio', direction: 'horizontal'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'foundry',
      type: 'reference',
      to: [{type: 'foundry'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'Get the font (URL)',
      type: 'url',
      validation: (rule) =>
        rule
          .required()
          .uri({scheme: ['http', 'https']})
          .error('Must start with http:// or https://'),
    }),
    defineField({
      name: 'preview',
      title: 'Preview (SVG wordmark)',
      type: 'image',
      description: 'The font name set in the font, outlined to an SVG with black fill.',
      options: {accept: 'image/svg+xml'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'order',
      type: 'number',
      description: 'Position on /fonts, lowest first. Use a negative number to put a new font at the top.',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'name', foundry: 'foundry.name', category: 'category', media: 'preview'},
    prepare({title, foundry, category, media}) {
      return {title, subtitle: [foundry, category].filter(Boolean).join(' · '), media}
    },
  },
  orderings: [
    {title: 'Order on /fonts', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]},
    {title: 'Name', name: 'nameAsc', by: [{field: 'name', direction: 'asc'}]},
  ],
})
