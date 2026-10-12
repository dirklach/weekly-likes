import {defineArrayMember, defineField, defineType} from 'sanity'

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

// Shown on the site as AEC–01, AEC–02, … (AE = Aetyc, C = Color).
export function paletteId(number?: number) {
  return number ? `AEC–${String(number).padStart(2, '0')}` : 'AEC–??'
}

// A color combination on /colors; the page filters by how many colors it has (2, 3 or 4).
export const paletteType = defineType({
  name: 'palette',
  title: 'Color Palette',
  type: 'document',
  fields: [
    defineField({
      name: 'number',
      type: 'number',
      description: 'Assigned automatically (highest so far + 1).',
      readOnly: true,
      initialValue: async (_params, {getClient}) => {
        const max = await getClient({apiVersion: '2024-01-01'}).fetch<number | null>(
          'math::max(*[_type == "palette"].number)',
        )
        return (max ?? 0) + 1
      },
      validation: (rule) =>
        rule
          .required()
          .integer()
          .positive()
          .custom(async (number, {document, getClient}) => {
            if (!number) return true
            const id = document?._id.replace(/^drafts\./, '')
            const taken = await getClient({apiVersion: '2024-01-01'}).fetch<number>(
              'count(*[_type == "palette" && number == $number && !(_id in [$id, $draft])])',
              {number, id, draft: `drafts.${id}`},
            )
            return taken ? `${paletteId(number)} is already taken` : true
          }),
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
  ],
  preview: {
    select: {number: 'number', colors: 'colors'},
    prepare({number, colors}) {
      return {
        title: paletteId(number),
        subtitle: (colors as string[] | undefined)?.join(' ') || 'No colors',
      }
    },
  },
  orderings: [{title: 'Number', name: 'numberDesc', by: [{field: 'number', direction: 'desc'}]}],
})
