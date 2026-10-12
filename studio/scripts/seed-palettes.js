// Creates the first ten color palettes for /colors (AEC–01 … AEC–10). Skips any that exist.
// Run: npx sanity exec scripts/seed-palettes.js --with-user-token
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-01-01'})

const PALETTES = [
  ['#1F2A44', '#E9E4D8'],
  ['#C4553A', '#F1E6D2', '#2B2B28'],
  ['#0F4C3A', '#E7DCC4', '#D9A441', '#8C2F39'],
  ['#FF5A1F', '#F4F1EC'],
  ['#A7B8A0', '#F3EEE3', '#4A3B2F'],
  ['#2E3A87', '#F2C14E', '#F7F3EA', '#111111'],
  ['#E8D9F1', '#3A2E5C', '#C8E26B'],
  ['#7A1E2C', '#F2B8A2'],
  ['#B5C7D3', '#5E6B73', '#E9E2D6', '#C46A2D'],
  ['#101010', '#E2E0DA', '#3D5AFE'],
]

const existing = await client.fetch('count(*[_type == "palette"])')
console.log(`Existing palettes: ${existing}`)

const transaction = client.transaction()
PALETTES.forEach((colors, i) => {
  const number = i + 1
  transaction.createIfNotExists({
    _id: `palette-aec-${String(number).padStart(2, '0')}`,
    _type: 'palette',
    number,
    colors,
  })
})
const result = await transaction.commit()
console.log(`Done: ${result.results.length} palettes created or already there.`)
