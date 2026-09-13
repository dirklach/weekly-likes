/**
 * Prepare Sanity import
 *
 * 1. Reads data.json
 * 2. Uploads images from the images/ folder to Sanity
 * 3. Writes import.ndjson ready for: sanity dataset import import.ndjson production --replace
 *
 * Usage:
 *   SANITY_TOKEN=<token> node scripts/import/prepare-import.mjs
 */

import {createClient} from '@sanity/client'
import {createReadStream, writeFileSync} from 'fs'
import {readFile} from 'fs/promises'
import path from 'path'
import {fileURLToPath} from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const client = createClient({
  projectId: 'bl19dtug',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
})

const data = JSON.parse(await readFile(path.join(__dirname, 'data.json'), 'utf-8'))

const docs = []

// ── Authors ──────────────────────────────────────────────────────────────────
for (const author of data.authors) {
  docs.push({
    _id: author.id,
    _type: 'author',
    name: author.name,
    ...(author.url && {url: author.url}),
  })
}

// ── Categories ───────────────────────────────────────────────────────────────
for (const category of data.categories) {
  docs.push({
    _id: category.id,
    _type: 'category',
    name: category.name,
  })
}

// ── Upload images & build editions ───────────────────────────────────────────
console.log('Building editions…')

for (const edition of data.editions) {
  const picks = []

  for (const pick of edition.picks) {
    let imageField = {}

    if (pick.image) {
      // Upload image
      const imagePath = path.join(__dirname, pick.image)
      const imageStream = createReadStream(imagePath)
      const filename = path.basename(imagePath)
      const ext = path.extname(filename).slice(1).toLowerCase()
      const contentType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`

      console.log(`  Uploading ${filename}…`)
      const asset = await client.assets.upload('image', imageStream, {filename, contentType})
      imageField = {
        image: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: asset._id,
          },
          ...(pick.alt && {alt: pick.alt}),
        },
      }
    }

    picks.push({
      _type: 'pick',
      _key: `${edition.number}-${picks.length + 1}`,
      title: pick.title,
      authors: pick.authors.map((authorId) => ({
        _type: 'reference',
        _ref: authorId,
        _key: authorId,
      })),
      category: {
        _type: 'reference',
        _ref: pick.category,
      },
      url: pick.url,
      ...imageField,
    })
  }

  docs.push({
    _id: `edition-${edition.number}`,
    _type: 'edition',
    number: edition.number,
    picks,
  })
}

// ── Write NDJSON ──────────────────────────────────────────────────────────────
const ndjson = docs.map((doc) => JSON.stringify(doc)).join('\n')
const outPath = path.join(__dirname, 'import.ndjson')
writeFileSync(outPath, ndjson, 'utf-8')

console.log(`\nDone! Written ${docs.length} documents to scripts/import/import.ndjson`)
console.log('\nNext step:')
console.log('  npx sanity dataset import scripts/import/import.ndjson production --replace')
