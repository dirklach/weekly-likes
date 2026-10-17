<script setup lang="ts">
const MORE_COUNT = 4;

const route = useRoute();
const { data } = await useFonts();
const fonts = computed(() => sortFontsByName(data.value || []));

const index = computed(
  () =>
    fonts.value.findIndex((item) => item.slug === String(route.params.slug)),
);
const font = computed(() => fonts.value[index.value] ?? null);

if (!font.value) {
  throw createError({ statusCode: 404, statusMessage: "Font not found" });
}

usePageSeo({
  title: () => `${font.value?.name} – Fonts | Aetyc`,
  description: () => {
    const item = font.value;
    if (!item) return "";
    const by = item.foundry?.name ? ` by ${item.foundry.name}` : "";
    const category = item.category ? ` ${item.category.toLowerCase()}` : "";
    return `${item.name}, a${category} typeface${by} (${item.license} license), hand-picked for the Aetyc font collection.`;
  },
  image: () =>
    font.value?.preview?.url ? ogImageFromSvgUrl(font.value.preview.url) : DEFAULT_OG_IMAGE,
});

// Random other fonts. Ids are chosen once on the server per page and reused on the client to
// avoid hydration mismatches.
const moreFontIds = useState<string[]>(`more-fonts:${route.path}`, () =>
  shuffled(fonts.value.map((item) => item._id))
    .filter((id) => id !== font.value?._id)
    .slice(0, MORE_COUNT),
);

const moreFonts = computed(() =>
  moreFontIds.value.flatMap(
    (id) => fonts.value.find((item) => item._id === id) ?? [],
  ),
);
</script>

<template>
  <section v-if="font" class="section">
    <div class="pick-detail | grid">
      <div class="pick__main | col" data-grid="df:12 md:6">
        <div class="pick-title">
          {{ font.name }}
        </div>
        <div class="pick-meta">
          <div class="pick-foundry">
            <div class="pick-key-value">
              <div class="pick-key">Foundry</div>
              <div class="pick-value">
                <a
                  v-if="font.foundry?.url"
                  class="text-link"
                  :href="font.foundry.url"
                  target="_blank"
                  rel="noreferrer"
                >
                  {{ font.foundry.name }}
                </a>
                <span v-else>{{ font.foundry?.name }}</span>
              </div>
            </div>
          </div>
          <div class="pick-category">
            <div class="pick-key-value">
              <div class="pick-key">Category</div>
              <div class="pick-value">{{ font.category }}</div>
            </div>
          </div>
          <div class="pick-license">
            <div class="pick-key-value">
              <div class="pick-key">License</div>
              <div class="pick-value">{{ font.license }}</div>
            </div>
          </div>
          <div class="pick-source">
            <div class="pick-key-value">
              <div class="pick-key">Source</div>
              <div class="pick-value">
                <a
                  v-if="font.url"
                  class="text-link"
                  :href="font.url"
                  target="_blank"
                  rel="noreferrer"
                >
                  Get the Font
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="pick__image | col" data-grid="df:12 md:6">
        <div class="pick-image__inner">
          <img
            v-if="font.preview"
            class="font-preview"
            :src="font.preview.url"
            :width="font.preview.width"
            :height="font.preview.height"
            :alt="font.name"
            fetchpriority="high"
          />
        </div>
      </div>
    </div>
  </section>

  <section v-if="moreFonts.length" class="section">
    <div class="grid">
      <div class="more-title | col" data-grid="df:12">
        <span>More fonts</span>
        <NuxtLink to="/fonts" class="text-link">Show all</NuxtLink>
      </div>
      <FontCard
        v-for="item in moreFonts"
        :key="item._id"
        :font="item"
        class="col"
        data-grid="df:6 sm:6 md:3"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
// The wordmark sits in the pick image box; keep it at its proportions instead of filling the box.
.pick-image__inner .font-preview {
  width: auto;
  height: 30%;
  max-width: 70%;
  object-fit: contain;
}
</style>
