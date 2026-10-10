<script setup lang="ts">
import type { Category, Edition, EditionPick } from "~/types/content";
import PickCard from "~/components/pick-card.vue";

const { hideCredits, zoomedOut } = useSitePrefs();
const creditsHidden = computed(() => hideCredits.value);
const { data: editions } = await useEditions();

usePageSeo({
  title: "Weekly Likes | Aetyc",
  description:
    "A weekly updated catalog of selected works in design, architecture, photography, and art. Three hand-picked works in your inbox every Friday.",
});

// Kept in memory only: survives navigating to a pick and back, resets on reload.
const activeCategories = useState<string[]>("weekly-categories", () => []);

// On phones one pick per week runs full width. Chosen at random once per page load (on the
// server, reused on the client to avoid hydration mismatches), so every pick gets its turn.
const featuredPicks = useState<Record<string, string>>("weekly-featured", () =>
  Object.fromEntries(
    (editions.value || []).flatMap((edition) => {
      const picks = edition.picks || [];
      const pick = picks[Math.floor(Math.random() * picks.length)];
      return pick ? [[edition._id, pick._key]] : [];
    }),
  ),
);

// Every category that appears on at least one pick, alphabetically.
const categories = computed(() => {
  const bySlug = new Map<string, Category & { slug: string }>();
  for (const edition of editions.value || []) {
    for (const pick of edition.picks || []) {
      const category = pick.category;
      if (!category?.name) continue;
      const slug = slugify(category.name);
      if (!bySlug.has(slug)) bySlug.set(slug, { ...category, slug });
    }
  }
  return [...bySlug.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
  );
});

const isFiltered = computed(() => activeCategories.value.length > 0);

// Matching picks across all weeks, newest first, without week grouping.
const filteredPicks = computed(() => {
  const active = new Set(activeCategories.value);
  const result: { edition: Edition; pick: EditionPick; anchor: boolean }[] = [];
  for (const edition of editions.value || []) {
    let anchor = true;
    for (const pick of edition.picks || []) {
      if (!pick.category?.name || !active.has(slugify(pick.category.name)))
        continue;
      result.push({ edition, pick, anchor });
      anchor = false;
    }
  }
  return result;
});

function setCategories(slugs: string[]) {
  activeCategories.value = slugs;
}

function toggleCategory(slug: string) {
  const active = activeCategories.value;
  setCategories(
    active.includes(slug)
      ? active.filter((item) => item !== slug)
      : categories.value
          .map((c) => c.slug)
          .filter((s) => s === slug || active.includes(s)),
  );
}
</script>

<template>
  <div class="intro | grid">
    <div class="col">
      <h1 class="heading-2">
        A weekly updated catalog of selected works in design, architecture,
        photography, and art. Subscribe to receive three beautiful picks in your
        inbox each week.
      </h1>
    </div>
  </div>
  <div class="category-filter-wrap">
    <div class="category-filter | grid">
      <div class="category-filter__bar | col" data-grid="df:12">
        <div class="category-filter__list">
          <button
            v-if="categories.length"
            type="button"
            class="button category-filter__button"
            :class="{ active: !isFiltered }"
            :aria-pressed="!isFiltered"
            @click="setCategories([])"
          >
            All
          </button>
          <button
            v-for="category in categories"
            :key="category.slug"
            type="button"
            class="button category-filter__button"
            :class="{ active: activeCategories.includes(category.slug) }"
            :aria-pressed="activeCategories.includes(category.slug)"
            @click="toggleCategory(category.slug)"
          >
            {{ category.name }}
          </button>
        </div>
        <NuxtLink
          to="/weekly/authors"
          class="category-filter__authors | text-link"
        >
          Authors
        </NuxtLink>
      </div>
    </div>
  </div>
  <div v-if="isFiltered">
    <p v-if="!filteredPicks.length" class="section grid">
      <span class="col" data-grid="df:12">No picks in this category yet.</span>
    </p>

    <section
      v-else
      class="section edition-section"
      :class="{ 'edition-section--zoomed-out': zoomedOut }"
    >
      <div class="edition-group | grid">
        <PickCard
          v-for="({ edition, pick, anchor }, index) in filteredPicks"
          :key="`${edition._id}-${pick._key}`"
          :id="anchor ? edition.number : undefined"
          :edition="edition"
          :pick="pick"
          class="edition--flat"
          data-grid="df:6 sm:4 md:4"
          :loading="index < 3 ? 'eager' : 'lazy'"
        />
      </div>
    </section>
  </div>
  <div v-else>
    <p v-if="!editions?.length" class="section grid">
      <span class="col" data-grid="df:12">No editions yet.</span>
    </p>

    <section
      v-for="(edition, editionIndex) in editions || []"
      :key="edition._id"
      class="section edition-section"
      :class="{ 'edition-section--zoomed-out': zoomedOut }"
    >
      <div class="edition-group | grid" :id="edition.number">
        <div
          class="edition-group__title | col"
          data-grid="df:12"
          :class="{ hide: creditsHidden }"
        >
          <div class="edition-group__title-inner">
            Week {{ edition.number }}
          </div>
        </div>
        <PickCard
          v-for="pick in edition.picks || []"
          :key="pick._key"
          :edition="edition"
          :pick="pick"
          :class="{
            'edition--featured': featuredPicks[edition._id] === pick._key,
          }"
          data-grid="df:6 sm:4 md:4"
          :loading="editionIndex === 0 ? 'eager' : 'lazy'"
        />
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
@use "~~/assets/scss/2-tools" as *;

.category-filter__bar {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
}

// Sits on the last line of pills when they wrap.
.category-filter__authors {
  flex-shrink: 0;
  align-self: end;
  margin-bottom: 6px;
}

.category-filter__list {
  display: flex;
  flex-wrap: wrap;
  min-width: 0;
  gap: var(--space-1);

  // Phones: one row that scrolls sideways instead of four rows of pills.
  @include maxbp(sm) {
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
    margin-left: calc(var(--default-page-padding) * -1);
    padding-left: var(--default-page-padding);

    &::-webkit-scrollbar {
      display: none;
    }

    > * {
      flex-shrink: 0;
    }
  }
}

.category-filter__button {
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

.edition--flat {
  scroll-margin-top: var(--overview-anchor-offset);
}

// Phones show two picks per row; with three per week the featured one runs full width,
// right below the week title.
@include maxbp(sm) {
  .edition-group__title {
    order: -2;
  }

  .edition--featured {
    order: -1;
    grid-column: span 12 / span 12;
  }
}
</style>
