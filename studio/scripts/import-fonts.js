/**
 * Imports the fonts from fonts.gallery (snapshot in scripts/fonts-gallery.json) as `font` and
 * `foundry` documents. Each SVG wordmark is uploaded as an image asset.
 * Dry run:  npx sanity exec scripts/import-fonts.js --with-user-token
 * Apply:    npx sanity exec scripts/import-fonts.js --with-user-token -- --apply
 * IDs are deterministic (font-<slug>, foundry-<slug>) and documents are only created if missing,
 * so reruns never touch existing documents.
 */
import {readFileSync} from 'node:fs'
import {getCliClient} from 'sanity/cli'

const APPLY = process.argv.includes('--apply')
const SOURCE = new URL('./fonts-gallery.json', import.meta.url)
const client = getCliClient({apiVersion: '2024-01-01'})

const slugify = (value) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

async function main() {
  console.log(APPLY ? 'APPLY mode: changes will be written.\n' : 'DRY RUN: nothing will be written. Add `-- --apply` to write.\n')
  const fonts = JSON.parse(readFileSync(SOURCE, 'utf8'))

  const foundries = new Map()
  for (const font of fonts) {
    const f = font.foundry?.[0]
    if (!f) throw new Error(`${font.font_name}: no foundry`)
    const _id = `foundry-${slugify(f.title)}`
    if (!foundries.has(_id)) foundries.set(_id, {_id, _type: 'foundry', name: f.title, url: f.acf?.foundry_website || undefined})
  }

  const docs = fonts.map((font) => {
    const slug = slugify(font.font_name)
    if (!font.svg_preview?.startsWith('<svg')) throw new Error(`${font.font_name}: no SVG preview`)
    return {
      _id: `font-${slug}`,
      _type: 'font',
      name: font.font_name,
      slug: {_type: 'slug', current: slug},
      category: font.category,
      license: font.license,
      foundry: {_type: 'reference', _ref: `foundry-${slugify(font.foundry[0].title)}`},
      url: font.font_link,
      svg: font.svg_preview,
    }
  })

  const slugs = docs.map((d) => d._id)
  const dupes = slugs.filter((id, i) => slugs.indexOf(id) !== i)
  if (dupes.length) throw new Error(`Duplicate slugs: ${dupes.join(', ')}`)

  const ids = [...foundries.keys(), ...slugs]
  const existing = new Set(await client.fetch(`*[_id in $ids || _id in $drafts]._id`, {ids, drafts: ids.map((id) => `drafts.${id}`)}))
  const isNew = (id) => !existing.has(id) && !existing.has(`drafts.${id}`)

  const tx = client.transaction()
  const stats = {foundries: 0, fonts: 0, skipped: 0}

  for (const foundry of foundries.values()) {
    if (!isNew(foundry._id)) { console.log(`  ${foundry.name}: exists, skipped`); stats.skipped++; continue }
    console.log(`  + foundry ${foundry.name}`)
    tx.createIfNotExists(foundry); stats.foundries++
  }

  for (const {svg, ...doc} of docs) {
    if (!isNew(doc._id)) { console.log(`  ${doc.name}: exists, skipped`); stats.skipped++; continue }
    let preview = {_type: 'image', asset: {_type: 'reference', _ref: '(uploaded on --apply)'}}
    if (APPLY) {
      // Sanity dedupes assets by content hash, so re-uploading the same SVG reuses the asset.
      const asset = await client.assets.upload('image', Buffer.from(svg), {filename: `font-${doc.slug.current}.svg`, contentType: 'image/svg+xml'})
      preview = {_type: 'image', asset: {_type: 'reference', _ref: asset._id}}
    }
    console.log(`  + font ${doc.name} (${doc.category}, ${doc.license}) /fonts/${doc.slug.current}`)
    tx.createIfNotExists({...doc, preview}); stats.fonts++
  }

  console.log(`\n${APPLY ? 'Created' : 'Would create'}: ${stats.foundries} foundries, ${stats.fonts} fonts`)
  console.log(`Already in the dataset: ${stats.skipped}`)
  if (APPLY && stats.foundries + stats.fonts) { await tx.commit(); console.log('\nDone.') }
}
main().catch((err) => { console.error(err.message || err); process.exit(1) })
