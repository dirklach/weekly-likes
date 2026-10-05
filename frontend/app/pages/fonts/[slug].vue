<script setup lang="ts">
const MORE_COUNT = 4;

const route = useRoute();
const { data: fonts } = await useFonts();

const index = computed(
  () => fonts.value?.findIndex((item) => item.slug === String(route.params.slug)) ?? -1,
);
const font = computed(() => fonts.value?.[index.value] ?? null);

if (!font.value) {
  throw createError({ statusCode: 404, statusMessage: "Font not found" });
}

useHead({ title: () => `${font.value?.name} | Aetyc` });

// The fonts that follow this one in the list, wrapping around at the end.
const moreFonts = computed(() => {
  const list = fonts.value || [];
  const count = Math.min(MORE_COUNT, list.length - 1);
  return Array.from({ length: count }, (_, i) => list[(index.value + i + 1) % list.length]!);
});
</script>

<template>
  <section v-if="font" class="section">
    <div class="grid">
      <div class="col" data-grid="df:12">
        <div class="font-hero">
          <img
            v-if="font.preview"
            class="font-hero__preview | font-preview"
            :src="font.preview.url"
            :width="font.preview.width"
            :height="font.preview.height"
            :alt="font.name"
            fetchpriority="high"
          />
          <h1 v-else class="heading-2">{{ font.name }}</h1>
          <div class="font-hero__actions">
            <a
              class="button"
              :href="font.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get the Font →
            </a>
            <a
              v-if="font.foundry?.url"
              class="button"
              :href="font.foundry.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ font.foundry.name }}
            </a>
            <span v-else-if="font.foundry" class="button">
              {{ font.foundry.name }}
            </span>
          </div>
        </div>
        <div class="font-meta">
          <div class="pick-key-value">
            <div class="pick-key">Category</div>
            <div class="pick-value">{{ font.category }}</div>
          </div>
          <div class="pick-key-value">
            <div class="pick-key">License</div>
            <div class="pick-value">{{ font.license }}</div>
          </div>
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
@use "~~/assets/scss/2-tools" as *;

.font-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60dvh;
  padding: var(--space-6) var(--space-2) calc(var(--space-6) + 2.5rem);
  background: var(--color-edition-image);
  transition: background-color 0.5s ease-out;
}

.font-hero__preview {
  width: auto;
  height: clamp(80px, 18vw, 220px);
  max-width: 80%;
  object-fit: contain;
}

.font-hero__actions {
  position: absolute;
  left: var(--space-2);
  right: var(--space-2);
  bottom: var(--space-2);
  display: flex;
  justify-content: space-between;
  gap: var(--space-1);
}

.font-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: var(--space-2);

  @include bp(md) {
    width: 50%;
  }
}

.font-more__title {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--space-1);
}

</style>
