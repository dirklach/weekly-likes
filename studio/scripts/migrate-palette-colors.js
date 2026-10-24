// Converts palette colors saved as hex strings into color picker values (drafts included).
// Dry run: npx sanity exec scripts/migrate-palette-colors.js --with-user-token
// Write:   npx sanity exec scripts/migrate-palette-colors.js --with-user-token -- --apply
import {getCliClient} from 'sanity/cli'
import {colorValue} from './color-value.js'

const client = getCliClient({apiVersion: '2024-01-01'})
const apply = process.argv.includes('--apply')

const palettes = await client.fetch(
  '*[_type == "palette" && count(colors[_type != "color"]) > 0]{_id, number, colors}',
)
console.log(`Palettes with hex strings: ${palettes.length}`)

const transaction = client.transaction()
for (const {_id, number, colors} of palettes) {
  const converted = colors.map((color) => (typeof color === 'string' ? colorValue(color) : color))
  console.log(`${_id} (${number}): ${colors.map((c) => c.hex ?? c).join(' ')}`)
  transaction.patch(_id, (patch) => patch.set({colors: converted}))
}

if (!apply) {
  console.log('Dry run, nothing written. Add -- --apply to write.')
} else if (palettes.length) {
  const result = await transaction.commit()
  console.log(`Done: ${result.results.length} palettes converted.`)
}
