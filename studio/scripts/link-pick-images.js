/**
 * Links uploaded image assets to the matching Edition pick.
 *   041-02.jpg  ->  Edition 041, pick #2
 * Dry run:  npx sanity exec scripts/link-pick-images.js --with-user-token
 * Apply:    npx sanity exec scripts/link-pick-images.js --with-user-token -- --apply
 * Picks that already have an image are skipped. Add `--overwrite` to replace them.
 */
import {getCliClient} from 'sanity/cli'

// ADJUST THESE TO MATCH YOUR SCHEMA
const EDITION_TYPE = 'edition'
const EDITION_NUMBER_FIELD = 'number'
const PICKS_FIELD = 'picks'
const PICK_IMAGE_FIELD = 'image'

const APPLY = process.argv.includes('--apply')
const OVERWRITE = process.argv.includes('--overwrite')
const FILENAME_RE = /^0*(\d+)[-_ ]0*(\d+)\.[a-z0-9]+$/i
const client = getCliClient({apiVersion: '2024-01-01'})
const imageValue = (assetId) => ({_type: 'image', asset: {_type: 'reference', _ref: assetId}})
const toNumber = (v) => { if (v == null) return null; const m = String(v).match(/\d+/); return m ? parseInt(m[0], 10) : null }
const pad = (n, len) => String(n).padStart(len, '0')

async function main() {
  console.log(APPLY ? 'APPLY mode: changes will be written.\n' : 'DRY RUN: nothing will be written. Add `-- --apply` to write.\n')
  const assets = await client.fetch(`*[_type == "sanity.imageAsset" && defined(originalFilename)]{_id, originalFilename}`)
  const assetByKey = new Map(); let otherImages = 0
  for (const asset of assets) {
    const m = asset.originalFilename.match(FILENAME_RE)
    if (!m) { otherImages++; continue }
    const key = `${parseInt(m[1], 10)}-${parseInt(m[2], 10)}`
    if (assetByKey.has(key)) { console.warn(`! ${asset.originalFilename} was uploaded more than once, using the first copy`); continue }
    assetByKey.set(key, asset)
  }
  console.log(`Found ${assets.length} image assets, ${assetByKey.size} named like NNN-NN.\n`)
  const editions = await client.fetch(`*[_type == $type]{_id, title, "num": ${EDITION_NUMBER_FIELD}, "picks": ${PICKS_FIELD}}`, {type: EDITION_TYPE})
  if (!editions.length) throw new Error(`No documents of type "${EDITION_TYPE}" found. Check EDITION_TYPE.`)
  const stats = {linked: 0, skipped: 0, missingFile: 0}; const tx = client.transaction(); const usedKeys = new Set()
  editions.sort((a, b) => (toNumber(a.num) ?? 0) - (toNumber(b.num) ?? 0))
  for (const edition of editions) {
    const num = toNumber(edition.num) ?? toNumber(edition.title)
    if (num === null) { console.warn(`! ${edition._id}: no edition number, skipped`); continue }
    const label = `Edition ${pad(num, 3)}${edition._id.startsWith('drafts.') ? ' (draft)' : ''}`
    const picks = Array.isArray(edition.picks) ? edition.picks : []
    if (!picks.length) { console.warn(`! ${label}: nothing in "${PICKS_FIELD}"`); continue }
    for (let i = 0; i < picks.length; i++) {
      const pick = picks[i]; const key = `${num}-${i + 1}`; const asset = assetByKey.get(key)
      if (!asset) { console.log(`  ${label} pick ${i + 1}: no file ${pad(num, 3)}-${pad(i + 1, 2)}.*`); stats.missingFile++; continue }
      usedKeys.add(key)
      if (pick._ref) {
        const pickDocs = await client.fetch(`*[_id in [$id, "drafts." + $id]]{_id, "img": ${PICK_IMAGE_FIELD}}`, {id: pick._ref})
        for (const doc of pickDocs) {
          if (doc.img?.asset && !OVERWRITE) { console.log(`  ${label} pick ${i + 1}: already has an image, skipped`); stats.skipped++; continue }
          console.log(`  ${label} pick ${i + 1}: ${asset.originalFilename} -> ${doc._id}`)
          tx.patch(doc._id, (p) => p.set({[PICK_IMAGE_FIELD]: imageValue(asset._id)})); stats.linked++
        }
      } else {
        if (pick[PICK_IMAGE_FIELD]?.asset && !OVERWRITE) { console.log(`  ${label} pick ${i + 1}: already has an image, skipped`); stats.skipped++; continue }
        if (!pick._key) { console.warn(`! ${label} pick ${i + 1}: item has no _key, can't patch it`); continue }
        console.log(`  ${label} pick ${i + 1}: ${asset.originalFilename}`)
        tx.patch(edition._id, (p) => p.set({[`${PICKS_FIELD}[_key=="${pick._key}"].${PICK_IMAGE_FIELD}`]: imageValue(asset._id)})); stats.linked++
      }
    }
  }
  const unused = [...assetByKey.entries()].filter(([k]) => !usedKeys.has(k)).map(([, a]) => a.originalFilename).sort()
  console.log(`\n${APPLY ? 'Linked' : 'Would link'}: ${stats.linked}`)
  console.log(`Already had an image: ${stats.skipped}`)
  console.log(`Picks with no matching file: ${stats.missingFile}`)
  if (unused.length) console.log(`Files that matched no pick: ${unused.join(', ')}`)
  if (otherImages) console.log(`Other images (not named NNN-NN, ignored): ${otherImages}`)
  if (APPLY && stats.linked) { await tx.commit(); console.log('\nDone.') }
}
main().catch((err) => { console.error(err.message || err); process.exit(1) })
