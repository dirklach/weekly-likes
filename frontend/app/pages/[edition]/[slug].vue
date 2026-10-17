<script setup lang="ts">
const route = useRoute();
const { data: editions } = await useEditions();

const edition = computed(
  () =>
    editions.value?.find(
      (item) => item.number === String(route.params.edition),
    ) ?? null,
);

if (!edition.value) {
  throw createError({ statusCode: 404, statusMessage: "Edition not found" });
}

const pick = computed(() => {
  const picks = edition.value?.picks || [];
  const slug = String(route.params.slug);
  return picks.find((item) => pickSlug(picks, item) === slug) ?? null;
});

if (!pick.value) {
  throw createError({ statusCode: 404, statusMessage: "Pick not found" });
}

usePageSeo({
  title: () => `${pick.value?.title} – Weekly Likes ${edition.value?.number} | Aetyc`,
  description: () => {
    const item = pick.value;
    if (!item) return "";
    const authors = authorNames(item);
    const by = authors ? ` by ${authors}` : "";
    const category = item.category?.name ? ` (${item.category.name})` : "";
    return `${item.title}${by}${category}, selected for Weekly Likes ${edition.value?.number} on Aetyc.`;
  },
  image: () =>
    pick.value?.image?.asset?._ref
      ? ogImageFromAsset(pick.value.image.asset._ref)
      : DEFAULT_OG_IMAGE,
});

const MORE_COUNT = 4;

// Random other picks. Keys are chosen once on the server per page and reused on the client to
// avoid hydration mismatches.
const morePickKeys = useState<string[]>(`more-picks:${route.path}`, () => {
  const current = `${edition.value?._id}:${pick.value?._key}`;
  return shuffled(
    (editions.value || []).flatMap((item) =>
      (item.picks || []).map((p) => `${item._id}:${p._key}`),
    ),
  )
    .filter((key) => key !== current)
    .slice(0, MORE_COUNT);
});

const morePicks = computed(() =>
  morePickKeys.value.flatMap((key) => {
    const [editionId, pickKey] = key.split(":");
    const item = editions.value?.find((e) => e._id === editionId);
    const p = item?.picks?.find((entry) => entry._key === pickKey);
    return item && p ? [{ edition: item, pick: p }] : [];
  }),
);

const pickIndex = computed(() => {
  const index =
    edition.value?.picks?.findIndex((item) => item._key === pick.value?._key) ??
    -1;
  return index >= 0 ? String(index + 1).padStart(2, "0") : "00";
});
</script>

<template>
  <section class="section">
    <div class="pick-detail | grid">
      <div class="pick__main | col" data-grid="df:12 md:6">
        <div class="pick-title">
          {{ pick.title }}
        </div>
        <div class="pick-meta">
          <div class="pick-week">
            <div class="pick-key-value">
              <div class="pick-key">Week</div>
              <div class="pick-value">{{ edition.number }}/{{ pickIndex }}</div>
            </div>
          </div>
          <div class="pick-author">
            <div class="pick-key-value">
              <div class="pick-key">By</div>
              <div class="pick-value">
                <template
                  v-for="author in pick.authors || []"
                  :key="author._id"
                >
                  <a
                    v-if="author.url"
                    class="text-link"
                    :href="author.url"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {{ author.name }}
                  </a>
                  <span v-else>{{ author.name }}</span>
                </template>
              </div>
            </div>
          </div>
          <div class="pick-week">
            <div class="pick-key-value">
              <div class="pick-key">Category</div>
              <div class="pick-value">{{ pick.category?.name }}</div>
            </div>
          </div>
          <div class="pick-week">
            <div class="pick-key-value">
              <div class="pick-key">Source</div>
              <div class="pick-value">
                <a
                  v-if="pick.url"
                  class="text-link"
                  :href="pick.url"
                  target="_blank"
                  rel="noreferrer"
                >
                  Visit
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="pick__image | col" data-grid="df:12 md:6">
        <div class="pick-image__inner">
          <PickImage
            v-if="pick.image?.asset?._ref"
            :asset-id="pick.image.asset._ref"
            :alt="pick.image.alt || pick.title"
            sizes="(min-width: 1024px) 50vw, 100vw"
            loading="eager"
          />
        </div>
        <div
          v-for="image in pick.gallery || []"
          :key="image._key"
          class="pick-image__inner"
        >
          <PickImage
            :asset-id="image.asset!._ref"
            :alt="image.alt || pick.title"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>
      </div>
    </div>
  </section>

  <section v-if="morePicks.length" class="section">
    <div class="grid">
      <div class="more-title | col" data-grid="df:12">
        <span>More picks</span>
        <NuxtLink to="/gallery" class="text-link">Show all</NuxtLink>
      </div>
      <PickCard
        v-for="item in morePicks"
        :key="`${item.edition._id}:${item.pick._key}`"
        :edition="item.edition"
        :pick="item.pick"
        data-grid="df:6 sm:6 md:3"
      />
    </div>
  </section>
</template>
