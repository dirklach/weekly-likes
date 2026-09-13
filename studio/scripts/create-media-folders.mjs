import {createClient} from '@sanity/client'

const client = createClient({
  projectId: 'bl19dtug',
  dataset: 'production',
  apiVersion: '2024-01-01',
  // Generate a token at https://sanity.io/manage → project → API → Tokens
  token: process.env.SANITY_TOKEN,
  useCdn: false,
})

// Configure your range here
const START = 2
const END = 49
const PAD = 3 // zero-pad to 3 digits → 002, 003 … 049

const folderNames = Array.from({length: END - START + 1}, (_, i) => {
  const n = i + START
  return String(n).padStart(PAD, '0')
})

console.log(`Creating ${folderNames.length} folders: ${folderNames[0]} … ${folderNames.at(-1)}`)

const transaction = client.transaction()

for (const name of folderNames) {
  transaction.createIfNotExists({
    _type: 'media.folder',
    _id: `media-folder-${name}`,
    name,
  })
}

const result = await transaction.commit()
console.log(`Done! Created/skipped ${result.results.length} folders.`)
