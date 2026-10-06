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

useHead({ title: () => `${font.value?.name} | Aetyc` });

// The fonts that follow this one alphabetically, wrapping around at the end.
const moreFonts = computed(() => {
  const list = fonts.value;
  const count = Math.min(MORE_COUNT, list.length - 1);
  return Array.from(
    { length: count },
    (_, i) => list[(index.value + i + 1) % list.length]!,
  );
});
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
      <div class="font-more__title | col" data-grid="df:12">
        <span>More fonts</span>
        <NuxtLink to="/fonts" class="text-link">Show all</NuxtLink>
      </div>
      <FontCard
        v-for="item in moreFonts"
        :key="item._id"
        :font="item"
        class="col"
        data-grid="df:12 sm:6 md:3"
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

.font-more__title {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: var(--space-6);
  margin-bottom: var(--space-1);
}
</style>
