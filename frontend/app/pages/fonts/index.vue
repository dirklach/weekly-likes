<script setup lang="ts">
import type { Font } from "~/types/content";

useHead({ title: "Fonts | Aetyc" });

const FILTERS = ["All", "Serif", "Sans Serif", "Other"] as const;
type Filter = (typeof FILTERS)[number];

const { data: fonts } = await useFonts();

// Kept in memory only: survives opening a font and coming back, resets on reload.
const activeFilter = useState<Filter>("fonts-filter", () => "All");
// Saved in a cookie like dark mode, so the server renders the chosen layout.
const { fontColumns: columns } = useSitePrefs();

// "Other" collects everything that is neither Serif nor Sans Serif (Display, Script, Monospace, …).
function matches(font: Font, filter: Filter) {
  if (filter === "All") return true;
  if (filter === "Other")
    return font.category !== "Serif" && font.category !== "Sans Serif";
  return font.category === filter;
}

const filteredFonts = computed(() =>
  sortFontsByName(fonts.value || []).filter((font) =>
    matches(font, activeFilter.value),
  ),
);
</script>

<template>
  <div class="intro | grid">
    <div class="col">
      <h1 class="heading-2">
        A hand-picked collection of {{ fonts?.length || "" }} typefaces from
        independent foundries and beyond, curated for their craft and character.
      </h1>
    </div>
  </div>

  <div class="font-filter | grid">
    <div class="font-filter__bar | col" data-grid="df:12">
      <div class="font-filter__list">
        <button
          v-for="filter in FILTERS"
          :key="filter"
          type="button"
          class="button font-filter__button"
          :class="{ active: activeFilter === filter }"
          :aria-pressed="activeFilter === filter"
          @click="activeFilter = filter"
        >
          {{ filter }}
        </button>
      </div>
      <div class="font-columns" role="group" aria-label="Columns">
        <button
          v-for="count in FONT_COLUMN_OPTIONS"
          :key="count"
          type="button"
          class="font-columns__option"
          :class="{ active: columns === count }"
          :aria-pressed="columns === count"
          :aria-label="`${count} columns`"
          @click="columns = count"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            :width="count * 15 - 3"
            height="12"
            :viewBox="`0 0 ${count * 15 - 3} 12`"
            fill="none"
            aria-hidden="true"
          >
            <rect
              v-for="i in count"
              :key="i"
              :x="(i - 1) * 15"
              width="12"
              height="12"
              rx="2"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>

  <section class="section">
    <p v-if="!filteredFonts.length" class="grid">
      <span class="col" data-grid="df:12">No fonts here yet.</span>
    </p>
    <div v-else class="font-grid | grid" :style="{ '--font-columns': columns }">
      <FontCard
        v-for="(font, index) in filteredFonts"
        :key="font._id"
        :font="font"
        :loading="index < 12 ? 'eager' : 'lazy'"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
@use "~~/assets/scss/2-tools" as *;

.font-filter {
  margin-bottom: var(--space-6);
}

.font-filter__bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
}

.font-filter__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.font-filter__button {
  font: inherit;
  border: 0;

  &.active {
    color: var(--color-secondary);
    background-color: var(--color-primary);

    &:hover {
      background-color: var(--color-primary);
    }
  }
}

// Column switcher only makes sense where the grid has more than one column.
.font-columns {
  display: none;

  @include bp(sm) {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
}

.font-columns__option {
  display: flex;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-primary);
  cursor: pointer;
  opacity: 0.3;
  transition: opacity var(--speed-fast);

  &:hover,
  &.active {
    opacity: 1;
  }
}

// Gaps and page margins come from .grid, like the edition grid; only the column count differs.
.font-grid {
  grid-template-columns: minmax(0, 1fr);

  @include bp(sm) {
    grid-template-columns: repeat(var(--font-columns), minmax(0, 1fr));
  }
}
</style>
