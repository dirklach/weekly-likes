<script setup lang="ts">
import type { Edition, EditionPick, Font } from "~/types/content";

const props = defineProps<{ query: string }>();

// Mounted on the first search, so the data only loads once someone actually searches.
const { data: editions, status: editionsStatus } = useEditions();
const { data: fonts, status: fontsStatus } = useFonts();
const { hideCredits } = useSitePrefs();

// Case and accents don't matter: "cafe" finds "Café".
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

// Every word of the query has to appear somewhere in the item's text.
const terms = computed(() => normalize(props.query).split(/\s+/).filter(Boolean));
const matches = (...fields: (string | null | undefined)[]) => {
  const text = normalize(fields.filter(Boolean).join(" "));
  return terms.value.every((term) => text.includes(term));
};

const picks = computed(() => {
  const result: { edition: Edition; pick: EditionPick }[] = [];
  for (const edition of editions.value || []) {
    for (const pick of edition.picks || []) {
      if (
        matches(
          pick.title,
          authorNames(pick),
          pick.category?.name,
          `Week ${edition.number}`,
        )
      )
        result.push({ edition, pick });
    }
  }
  return result;
});

const matchingFonts = computed(() =>
  sortFontsByName(fonts.value || []).filter((font: Font) =>
    matches(font.name, font.foundry?.name, font.category, font.license),
  ),
);

const loading = computed(
  () =>
    (editionsStatus.value === "pending" && !editions.value) ||
    (fontsStatus.value === "pending" && !fonts.value),
);
const total = computed(() => picks.value.length + matchingFonts.value.length);
const empty = computed(() => !loading.value && !total.value);
</script>

<template>
  <div class="search-results" aria-live="polite">
    <p v-if="loading" class="grid">
      <span class="col" data-grid="df:12">Searching…</span>
    </p>

    <p v-else-if="empty" class="search-results__empty | grid">
      <span class="col" data-grid="df:12">
        Sorry, nothing found for “{{ query }}”.
      </span>
    </p>

    <section v-else class="section edition-section">
      <div class="edition-group | grid">
        <div class="edition-group__title | col" data-grid="df:12">
          <div class="edition-group__title-inner">
            Results ({{ total }})
          </div>
        </div>
        <!-- Picks first, then fonts, all in the same columns. -->
        <PickCard
          v-for="({ edition, pick }, index) in picks"
          :key="`${edition._id}-${pick._key}`"
          :edition="edition"
          :pick="pick"
          data-grid="df:6 sm:4 md:4"
          :loading="index < 6 ? 'eager' : 'lazy'"
          show-week
        />
        <!-- Built like PickCard (image box + text) so fonts and picks read as one list. -->
        <NuxtLink
          v-for="(font, index) in matchingFonts"
          :key="font._id"
          :to="`/fonts/${font.slug}`"
          class="edition | col"
          data-grid="df:6 sm:4 md:4"
        >
          <div class="edition-image-container">
            <img
              v-if="font.preview"
              class="font-preview search-results__font-preview"
              :src="font.preview.url"
              :width="font.preview.width"
              :height="font.preview.height"
              :alt="font.name"
              :loading="picks.length + index < 6 ? 'eager' : 'lazy'"
              decoding="async"
            />
          </div>
          <div class="edition-text" :class="{ hide: hideCredits }">
            <div class="edition-text__inner">
              <span class="edition-name">{{ font.name }}</span>
              <span class="edition-author">{{ font.foundry?.name }}</span>
              <span class="edition-category">{{ font.category }}</span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
@use "~~/assets/scss/2-tools" as *;

// The wordmark keeps its proportions inside the pick image box, like on the font detail page.
.search-results__font-preview {
  width: auto;
  height: 30%;
  max-width: 70%;
  object-fit: contain;
}
</style>
