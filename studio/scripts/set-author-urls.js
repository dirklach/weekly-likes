/**
 * Sets the website URL on Author documents from scripts/author-urls.json:
 *   {"Studio Feixen": "https://www.studiofeixen.ch/", ...}
 * Every author document with that exact name gets the URL (duplicates and drafts included).
 * Dry run:  npx sanity exec scripts/set-author-urls.js --with-user-token
 * Apply:    npx sanity exec scripts/set-author-urls.js --with-user-token -- --apply
 * Authors that already have a URL are skipped. Add `--overwrite` to replace them.
 */
import {readFileSync} from 'node:fs'
import {getCliClient} from 'sanity/cli'

const AUTHOR_TYPE = 'author'
const URL_FIELD = 'url'
const INPUT = new URL('./author-urls.json', import.meta.url)

const APPLY = process.argv.includes('--apply')
const OVERWRITE = process.argv.includes('--overwrite')
const client = getCliClient({apiVersion: '2024-01-01'})

async function main() {
  console.log(APPLY ? 'APPLY mode: changes will be written.\n' : 'DRY RUN: nothing will be written. Add `-- --apply` to write.\n')
  const urls = JSON.parse(readFileSync(INPUT, 'utf8'))
  const authors = await client.fetch(`*[_type == $type]{_id, name, "url": ${URL_FIELD}}`, {type: AUTHOR_TYPE})
  const stats = {set: 0, skipped: 0, unchanged: 0}; const tx = client.transaction(); const unmatched = []
  for (const [name, url] of Object.entries(urls).sort(([a], [b]) => a.localeCompare(b))) {
    if (!/^https?:\/\//.test(url)) { console.warn(`! ${name}: "${url}" is not an http(s) URL, skipped`); continue }
    const docs = authors.filter((a) => a.name === name)
    if (!docs.length) { unmatched.push(name); continue }
    for (const doc of docs) {
      const label = `${name}${doc._id.startsWith('drafts.') ? ' (draft)' : ''} [${doc._id}]`
      if (doc.url === url) { stats.unchanged++; continue }
      if (doc.url && !OVERWRITE) { console.log(`  ${label}: already has ${doc.url}, skipped`); stats.skipped++; continue }
      console.log(`  ${label}: ${doc.url ? `${doc.url} -> ` : ''}${url}`)
      tx.patch(doc._id, (p) => p.set({[URL_FIELD]: url})); stats.set++
    }
  }
  console.log(`\n${APPLY ? 'Set' : 'Would set'}: ${stats.set}`)
  console.log(`Already had a different URL: ${stats.skipped}`)
  console.log(`Already correct: ${stats.unchanged}`)
  if (unmatched.length) console.log(`Names with no matching author: ${unmatched.join(', ')}`)
  if (APPLY && stats.set) { await tx.commit(); console.log('\nDone.') }
}
main().catch((err) => { console.error(err.message || err); process.exit(1) })
