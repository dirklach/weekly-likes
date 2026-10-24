/**
 * Adds new picks as new Editions, without touching existing ones.
 *
 * Put a picks.json and the images in scripts/new-picks/, then run from studio/:
 *   npx sanity exec scripts/add-picks.js --with-user-token            (dry run, writes nothing)
 *   npx sanity exec scripts/add-picks.js --with-user-token -- --apply (uploads images, creates editions)
 *
 * picks.json is a list, three picks per edition, in order:
 *   [{"title": "…", "authors": ["Studio Name"], "category": "Brand Identity",
 *     "url": "https://…", "image": "052-01.jpg", "alt": "optional",
 *     "edition": "052" (optional, otherwise numbered on from the newest edition)}]
 *
 * Authors and categories are matched by name (case-insensitive). Unknown authors are
 * created; an unknown category stops the run so we don't end up with a near-duplicate.
 */
import {getCliClient} from 'sanity/cli'
import {createReadStream, existsSync, readFileSync} from 'fs'
import path from 'path'

const APPLY = process.argv.includes('--apply')
const DIR = path.resolve('scripts/new-picks')

const client = getCliClient({apiVersion: '2024-01-01'})

const norm = (s) => String(s).trim().toLowerCase()
const pad = (n) => String(n).padStart(3, '0')
const slug = (s) =>
  norm(s)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

async function main() {
  console.log(
    APPLY
      ? 'APPLY mode: changes will be written.\n'
      : 'DRY RUN: nothing will be written. Add `-- --apply` to write.\n',
  )

  const picks = JSON.parse(readFileSync(path.join(DIR, 'picks.json'), 'utf-8'))
  if (!Array.isArray(picks) || !picks.length) throw new Error('picks.json must be a non-empty list')

  const [authors, categories, numbers] = await Promise.all([
    client.fetch(`*[_type == "author" && !(_id in path("drafts.**"))]{_id, name}`),
    client.fetch(
      `*[_type == "category" && !(_id in path("drafts.**"))]{_id, name, "used": count(*[_type == "edition" && ^._id in picks[].category._ref])}`,
    ),
    client.fetch(`*[_type == "edition"].number`),
  ])
  const authorByName = new Map(authors.map((a) => [norm(a.name), a._id]))
  // Some names exist twice; least-used first so the category already in use wins
  categories.sort((a, b) => a.used - b.used)
  const categoryByName = new Map(categories.map((c) => [norm(c.name), c._id]))
  const taken = new Set(numbers)
  let next = Math.max(0, ...numbers.map((n) => parseInt(n, 10)).filter(Number.isFinite)) + 1

  // Check everything before writing anything
  const problems = []
  const newAuthors = new Map()
  picks.forEach((p, i) => {
    const at = `pick ${i + 1} (${p.title || 'no title'})`
    for (const f of ['title', 'category', 'url', 'image']) if (!p[f]) problems.push(`${at}: missing ${f}`)
    if (!Array.isArray(p.authors) || !p.authors.length) problems.push(`${at}: missing authors`)
    if (p.url && !/^https?:\/\//.test(p.url)) problems.push(`${at}: url must start with http(s)://`)
    if (p.category && !categoryByName.has(norm(p.category)))
      problems.push(`${at}: no category "${p.category}" (have: ${[...new Set(categories.map((c) => c.name))].sort().join(', ')})`)
    if (p.image && !existsSync(path.join(DIR, p.image))) problems.push(`${at}: image ${p.image} not found`)
    for (const name of p.authors || [])
      if (!authorByName.has(norm(name)) && !newAuthors.has(norm(name)))
        newAuthors.set(norm(name), {_id: `author-${slug(name)}`, _type: 'author', name: name.trim()})
  })

  // Group into editions of three
  const editions = []
  for (let i = 0; i < picks.length; i += 3) {
    const group = picks.slice(i, i + 3)
    let number = group[0].edition ? pad(parseInt(group[0].edition, 10)) : null
    if (!number) {
      while (taken.has(pad(next))) next++
      number = pad(next++)
    }
    if (taken.has(number)) problems.push(`Edition ${number} already exists`)
    if (group.length !== 3) problems.push(`Edition ${number} would have ${group.length} picks, needs exactly 3`)
    taken.add(number)
    editions.push({number, picks: group})
  }

  for (const a of newAuthors.values()) console.log(`New author: ${a.name} (${a._id})`)
  for (const e of editions) {
    console.log(`\nEdition ${e.number}`)
    e.picks.forEach((p, i) =>
      console.log(`  ${i + 1}. ${p.title} · ${(p.authors || []).join(', ')} · ${p.category} (${categoryByName.get(norm(p.category)) ?? '?'}) · ${p.image}`),
    )
  }

  if (problems.length) {
    console.log(`\nFix these first:\n${problems.map((p) => `  ! ${p}`).join('\n')}`)
    process.exit(1)
  }
  if (!APPLY) {
    console.log(`\nWould create ${editions.length} edition(s) and ${newAuthors.size} author(s).`)
    return
  }

  for (const a of newAuthors.values()) {
    await client.createIfNotExists(a)
    authorByName.set(norm(a.name), a._id)
  }

  for (const e of editions) {
    const docPicks = []
    for (const [i, p] of e.picks.entries()) {
      const file = path.join(DIR, p.image)
      // Name uploads NNN-NN so link-pick-images.js keeps matching them
      const ext = path.extname(p.image).toLowerCase()
      const filename = `${e.number}-${String(i + 1).padStart(2, '0')}${ext}`
      console.log(`Uploading ${p.image} as ${filename}…`)
      const asset = await client.assets.upload('image', createReadStream(file), {filename})
      docPicks.push({
        _type: 'pick',
        _key: `${e.number}-${i + 1}`,
        title: p.title,
        authors: p.authors.map((name) => {
          const id = authorByName.get(norm(name))
          return {_type: 'reference', _ref: id, _key: id}
        }),
        category: {_type: 'reference', _ref: categoryByName.get(norm(p.category))},
        url: p.url,
        image: {
          _type: 'image',
          asset: {_type: 'reference', _ref: asset._id},
          ...(p.alt && {alt: p.alt}),
        },
      })
    }
    await client.create({_id: `edition-${e.number}`, _type: 'edition', number: e.number, picks: docPicks})
    console.log(`Created Edition ${e.number}`)
  }
  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
