/**
 * Merges the many one-off categories into a short set of top-level categories.
 * Every pick is pointed at its new category; target categories are renamed.
 * Dry run:  npx sanity exec scripts/merge-categories.js --with-user-token
 * Apply:    npx sanity exec scripts/merge-categories.js --with-user-token -- --apply
 * Category documents left without picks are only listed. Add `--delete-unused`
 * (together with `--apply`) to delete them as well.
 */
import {getCliClient} from 'sanity/cli'

// Target category document -> new name
const TARGETS = {
  'cat-brand-identity': 'Brand Identity',
  'cat-website': 'Website',
  'cat-book': 'Books & Editorial',
  'cat-architecture': 'Architecture & Interior',
  'cat-design': 'Graphic Design',
  'cat-art': 'Art',
  'cat-product-design': 'Product Design',
  'cat-interview': 'Interviews & Video',
}

// Current category name -> target category document
const MERGE = {
  'Brand Identity': 'cat-brand-identity',
  'Brand Design': 'cat-brand-identity',
  'Brand Identity & Packaging': 'cat-brand-identity',
  'Brand Identity & Website': 'cat-brand-identity',
  'Visual Identity': 'cat-brand-identity',
  'Logo': 'cat-brand-identity',
  'Logo Design': 'cat-brand-identity',
  'Campaign': 'cat-brand-identity',

  'Website': 'cat-website',
  'Portfolio': 'cat-website',

  'Book': 'cat-book',
  'Book Cover': 'cat-book',
  'Book Design': 'cat-book',
  'Editorial Design': 'cat-book',
  'Magazine Cover': 'cat-book',
  'Quote / Book': 'cat-book',

  'Architecture': 'cat-architecture',
  'Architecture & Interior': 'cat-architecture',
  'Interior': 'cat-architecture',
  'Interior & Furniture': 'cat-architecture',
  'Store Concept': 'cat-architecture',

  'Design': 'cat-design',
  'Poster': 'cat-design',
  'Poster Series / Tool': 'cat-design',
  'Typeface': 'cat-design',
  'Typography System': 'cat-design',
  'Stamp Series': 'cat-design',
  'Packaging': 'cat-design',
  'Packaging Design': 'cat-design',

  'Art': 'cat-art',
  'Artwork': 'cat-art',
  'Painting': 'cat-art',
  'Wall Painting': 'cat-art',
  'Hand-painted Tennis Court': 'cat-art',
  'Installation': 'cat-art',
  'Quote': 'cat-art',

  'Product Design': 'cat-product-design',
  'Product': 'cat-product-design',
  '3D': 'cat-product-design',
  'Chair': 'cat-product-design',

  'Interview': 'cat-interview',
  'Video': 'cat-interview',
  'Designer': 'cat-interview',
}

const APPLY = process.argv.includes('--apply')
const DELETE_UNUSED = process.argv.includes('--delete-unused')
const client = getCliClient({apiVersion: '2024-01-01'})
const categoryRef = (id) => ({_type: 'reference', _ref: id})
const baseId = (id) => id.replace(/^drafts\./, '')
// Target categories map to themselves, so the script can be re-run after renaming.
const targetFor = (category) => (TARGETS[baseId(category._id)] ? baseId(category._id) : MERGE[category.name])

async function main() {
  console.log(APPLY ? 'APPLY mode: changes will be written.\n' : 'DRY RUN: nothing will be written. Add `-- --apply` to write.\n')
  const categories = await client.fetch(`*[_type == "category"]{_id, name}`)
  const byId = new Map(categories.map((c) => [c._id.replace(/^drafts\./, ''), c]))
  for (const id of Object.keys(TARGETS)) {
    if (!byId.has(id)) throw new Error(`Target category "${id}" does not exist.`)
  }
  const unmapped = categories.filter((c) => !targetFor(c))
  if (unmapped.length) throw new Error(`No mapping for: ${unmapped.map((c) => `${c.name} (${c._id})`).join(', ')}`)

  const tx = client.transaction()
  const stats = {renamed: 0, moved: 0, unchanged: 0}
  const counts = new Map()

  for (const category of categories) {
    const target = TARGETS[category._id.replace(/^drafts\./, '')]
    if (target && category.name !== target) {
      console.log(`  rename ${category._id}: "${category.name}" -> "${target}"`)
      tx.patch(category._id, (p) => p.set({name: target})); stats.renamed++
    }
  }
  if (stats.renamed) console.log('')

  const editions = await client.fetch(`*[_type == "edition"] | order(number asc){_id, number, picks[]{_key, title, "cat": category._ref}}`)
  for (const edition of editions) {
    const label = `Edition ${edition.number}${edition._id.startsWith('drafts.') ? ' (draft)' : ''}`
    for (const pick of edition.picks || []) {
      const current = byId.get(pick.cat)
      if (!current) { console.warn(`! ${label} "${pick.title}": unknown category ${pick.cat}, skipped`); continue }
      const target = targetFor(current)
      const key = `${current.name} -> ${TARGETS[target]}`
      counts.set(key, (counts.get(key) || 0) + 1)
      if (pick.cat === target) { stats.unchanged++; continue }
      console.log(`  ${label} "${pick.title}": ${current.name} -> ${TARGETS[target]}`)
      tx.patch(edition._id, (p) => p.set({[`picks[_key=="${pick._key}"].category`]: categoryRef(target)})); stats.moved++
    }
  }

  const totals = new Map()
  for (const [key, n] of counts) {
    const target = key.split(' -> ')[1]
    totals.set(target, (totals.get(target) || 0) + n)
  }
  console.log('\nMapping (old -> new: picks)')
  for (const [key, n] of [...counts].sort((a, b) => a[0].localeCompare(b[0]))) console.log(`  ${key}: ${n}`)
  console.log('\nNew categories')
  for (const [name, n] of [...totals].sort((a, b) => b[1] - a[1])) console.log(`  ${name}: ${n}`)

  const unused = categories.filter((c) => !TARGETS[c._id.replace(/^drafts\./, '')])
  console.log(`\n${APPLY ? 'Renamed' : 'Would rename'}: ${stats.renamed} categories`)
  console.log(`${APPLY ? 'Moved' : 'Would move'}: ${stats.moved} picks (${stats.unchanged} already in place)`)
  console.log(`Categories without picks afterwards: ${unused.length}${DELETE_UNUSED ? '' : ' (kept, add `--delete-unused` to remove)'}`)
  if (APPLY && (stats.renamed || stats.moved)) { await tx.commit(); console.log('\nDone.') }
  if (APPLY && DELETE_UNUSED && unused.length) {
    const del = client.transaction()
    for (const c of unused) del.delete(c._id)
    await del.commit(); console.log(`Deleted ${unused.length} unused categories.`)
  }
}
main().catch((err) => { console.error(err.message || err); process.exit(1) })
