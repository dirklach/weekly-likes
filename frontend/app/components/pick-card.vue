<script setup lang="ts">
import type { Edition, EditionPick } from "~/types/content";

withDefaults(
  defineProps<{
    edition: Edition;
    pick: EditionPick;
    loading?: "lazy" | "eager";
    // Adds "Week 051" below the category, for lists that mix weeks (search results).
    showWeek?: boolean;
  }>(),
  { loading: "lazy", showWeek: false },
);

const { hideCredits } = useSitePrefs();
</script>

<template>
  <NuxtLink :to="pickHref(edition, pick)" class="edition | col">
    <div class="edition-image-container">
      <PickImage
        v-if="pick.image?.asset?._ref"
        :asset-id="pick.image.asset._ref"
        :alt="pick.image.alt || pick.title"
        class="edition-image"
        sizes="(min-width: 768px) 33vw, 100vw"
        :loading="loading"
      />
    </div>
    <div class="edition-text" :class="{ hide: hideCredits }">
      <div class="edition-text__inner">
        <span class="edition-name">{{ pick.title }}</span>
        <span class="edition-author">{{ authorNames(pick) }}</span>
        <span class="edition-category">{{ pick.category?.name }}</span>
        <span v-if="showWeek" class="edition-week">Week {{ edition.number }}</span>
      </div>
    </div>
  </NuxtLink>
</template>
