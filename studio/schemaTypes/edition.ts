import {defineArrayMember, defineField, defineType} from 'sanity'

export const editionType = defineType({
  name: 'edition',
  title: 'Edition',
  type: 'document',
  fields: [
    defineField({
      name: 'number',
      type: 'string',
      description: 'Always three digits, e.g. 048',
      validation: (rule) =>
        rule
          .required()
          .regex(/^\d{3}$/, {name: 'three digits'})
          .error('Use three digits, e.g. 048'),
    }),
    defineField({
      name: 'picks',
      type: 'array',
      of: [defineArrayMember({type: 'pick'})],
      validation: (rule) =>
        rule.required().length(3).error('Each edition has exactly three picks'),
      initialValue: [{_type: 'pick'}, {_type: 'pick'}, {_type: 'pick'}],
    }),
  ],
  preview: {
    select: {number: 'number'},
    prepare({number}) {
      return {title: number ? `Edition ${number}` : 'Edition'}
    },
  },
  orderings: [
    {
      title: 'Number, newest',
      name: 'numberDesc',
      by: [{field: 'number', direction: 'desc'}],
    },
  ],
})
