/**
 * Links uploaded image assets to the matching Edition pick.
 *
 *   041-02.jpg  ->  Edition 041, pick #2
 *
 * Run from your Studio folder:
 *   npx sanity exec scripts/link-pick-images.js --with-user-token            (dry run, writes nothing)
 *   npx sanity exec scripts/link-pick-images.js --with-user-token -- --apply (writes the links)
 *
 * Picks that already have an image are skipped. Add `-- --apply --overwrite` to replace them.
 */
import { getCliClient } from "sanity/cli";

// ---------------------------------------------------------------------------
// ADJUST THESE TO MATCH YOUR SCHEMA
// ---------------------------------------------------------------------------
const EDITION_TYPE = "edition"; // _type of an Edition document
const EDITION_NUMBER_FIELD = "number"; // field holding 41 or "041" (falls back to digits in `title`)
const PICKS_FIELD = "picks"; // array field on the Edition holding the three picks
const PICK_IMAGE_FIELD = "image"; // image field on each pick
// ---------------------------------------------------------------------------

const APPLY = process.argv.includes("--apply");
const OVERWRITE = process.argv.includes("--overwrite");
const FILENAME_RE = /^0*(\d+)[-_ ]0*(\d+)\.[a-z0-9]+$/i;

const client = getCliClient({ apiVersion: "2024-01-01" });

const imageValue = (assetId) => ({
  _type: "image",
  asset: { _type: "reference", _ref: assetId },
});

const toNumber = (value) => {
  if (value === undefined || value === null) return null;
  const match = String(value).match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
};

const pad = (n, len) => String(n).padStart(len, "0");

async function main() {
  console.log(
    APPLY
      ? "APPLY mode: changes will be written.\n"
      : "DRY RUN: nothing will be written. Add `-- --apply` to write.\n",
  );

  // 1. Image assets, keyed by "edition-pick" from their original filename
  const assets = await client.fetch(
    `*[_type == "sanity.imageAsset" && defined(originalFilename)]{_id, originalFilename}`,
  );
  const assetByKey = new Map();
  let otherImages = 0;
  for (const asset of assets) {
    const m = asset.originalFilename.match(FILENAME_RE);
    if (!m) {
      otherImages++;
      continue;
    }
    const key = `${parseInt(m[1], 10)}-${parseInt(m[2], 10)}`;
    if (assetByKey.has(key)) {
      console.warn(
        `! ${asset.originalFilename} was uploaded more than once, using the first copy`,
      );
      continue;
    }
    assetByKey.set(key, asset);
  }
  console.log(
    `Found ${assets.length} image assets, ${assetByKey.size} named like NNN-NN.\n`,
  );

  // 2. Editions, published and drafts (so an open draft doesn't undo the change when published)
  const editions = await client.fetch(
    `*[_type == $type]{_id, title, "num": ${EDITION_NUMBER_FIELD}, "picks": ${PICKS_FIELD}}`,
    { type: EDITION_TYPE },
  );
  if (!editions.length) {
    throw new Error(
      `No documents of type "${EDITION_TYPE}" found. Check EDITION_TYPE at the top of the script.`,
    );
  }

  const stats = { linked: 0, skipped: 0, missingFile: 0 };
  const tx = client.transaction();
  const usedKeys = new Set();

  editions.sort((a, b) => (toNumber(a.num) ?? 0) - (toNumber(b.num) ?? 0));

  for (const edition of editions) {
    const num = toNumber(edition.num) ?? toNumber(edition.title);
    if (num === null) {
      console.warn(
        `! ${edition._id}: no edition number in "${EDITION_NUMBER_FIELD}" or title, skipped`,
      );
      continue;
    }
    const label = `Edition ${pad(num, 3)}${edition._id.startsWith("drafts.") ? " (draft)" : ""}`;
    const picks = Array.isArray(edition.picks) ? edition.picks : [];
    if (!picks.length) {
      console.warn(`! ${label}: nothing in "${PICKS_FIELD}"`);
      continue;
    }

    for (let i = 0; i < picks.length; i++) {
      const pick = picks[i];
      const key = `${num}-${i + 1}`;
      const asset = assetByKey.get(key);
      if (!asset) {
        console.log(
          `  ${label} pick ${i + 1}: no file ${pad(num, 3)}-${pad(i + 1, 2)}.*`,
        );
        stats.missingFile++;
        continue;
      }
      usedKeys.add(key);

      if (pick._ref) {
        // Picks are separate documents referenced from the edition
        const pickDocs = await client.fetch(
          `*[_id in [$id, "drafts." + $id]]{_id, "img": ${PICK_IMAGE_FIELD}}`,
          { id: pick._ref },
        );
        for (const doc of pickDocs) {
          if (doc.img?.asset && !OVERWRITE) {
            console.log(
              `  ${label} pick ${i + 1}: already has an image, skipped`,
            );
            stats.skipped++;
            continue;
          }
          console.log(
            `  ${label} pick ${i + 1}: ${asset.originalFilename} -> ${doc._id}`,
          );
          tx.patch(doc._id, (p) =>
            p.set({ [PICK_IMAGE_FIELD]: imageValue(asset._id) }),
          );
          stats.linked++;
        }
      } else {
        // Picks are objects stored inside the edition
        if (pick[PICK_IMAGE_FIELD]?.asset && !OVERWRITE) {
          console.log(
            `  ${label} pick ${i + 1}: already has an image, skipped`,
          );
          stats.skipped++;
          continue;
        }
        if (!pick._key) {
          console.warn(
            `! ${label} pick ${i + 1}: item has no _key, can't patch it`,
          );
          continue;
        }
        console.log(`  ${label} pick ${i + 1}: ${asset.originalFilename}`);
        tx.patch(edition._id, (p) =>
          p.set({
            [`${PICKS_FIELD}[_key=="${pick._key}"].${PICK_IMAGE_FIELD}`]:
              imageValue(asset._id),
          }),
        );
        stats.linked++;
      }
    }
  }

  const unused = [...assetByKey.entries()]
    .filter(([k]) => !usedKeys.has(k))
    .map(([, a]) => a.originalFilename)
    .sort();

  console.log(`\n${APPLY ? "Linked" : "Would link"}: ${stats.linked}`);
  console.log(`Already had an image: ${stats.skipped}`);
  console.log(`Picks with no matching file: ${stats.missingFile}`);
  if (unused.length)
    console.log(`Files that matched no pick: ${unused.join(", ")}`);
  if (otherImages)
    console.log(`Other images (not named NNN-NN, ignored): ${otherImages}`);

  if (APPLY && stats.linked) {
    await tx.commit();
    console.log("\nDone.");
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
