<script setup lang="ts">
import type { Font } from "~/types/content";

withDefaults(
  defineProps<{
    font: Font;
    loading?: "lazy" | "eager";
  }>(),
  { loading: "lazy" },
);
</script>

<template>
  <NuxtLink
    :to="`/fonts/${font.slug}`"
    class="font-card"
    :data-category="font.category"
    :data-license="font.license"
    :aria-label="
      font.foundry ? `${font.name} by ${font.foundry.name}` : font.name
    "
  >
    <img
      v-if="font.preview"
      class="font-preview"
      :src="font.preview.url"
      :width="font.preview.width"
      :height="font.preview.height"
      :alt="font.name"
      :loading="loading"
      decoding="async"
    />
    <span v-else>{{ font.name }}</span>
  </NuxtLink>
</template>

<style scoped lang="scss">
@use "~~/assets/scss/2-tools" as *;

.font-card {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 4 / 3;
  min-width: 0;
  overflow: hidden;
  padding: var(--space-2);
  background: var(--color-edition-image);
  color: var(--color-primary);
  font-size: var(--size-2);
  transition:
    transform 0.4s,
    background-color 0.5s ease-out;

  .font-preview {
    height: 80px;
    max-width: 65%;
    width: auto;
    object-fit: contain;

    // Two cards per row on phones.
    @include maxbp(sm) {
      height: 36px;
      max-width: 75%;
    }
  }
}
</style>
