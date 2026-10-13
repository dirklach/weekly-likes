<script setup lang="ts">
usePageSeo({
  title: "Colors | Aetyc",
  description:
    "A collection of color combinations from the works we love. Copy any color as a hex code.",
  image: SITE_OG_IMAGE,
});

const COUNTS = [2, 3, 4] as const;

const route = useRoute();
const { data: palettes } = await usePalettes();

// Mirrored in the URL (?colors=3), so a filtered view can be shared. Updated with
// replaceState rather than the router, which would dim the page and scroll to the top.
const parseCount = (value: unknown) => {
  const count = Number(value);
  return (COUNTS as readonly number[]).includes(count) ? count : null;
};
const activeCount = ref(parseCount(route.query.colors));

function setCount(count: number | null) {
  activeCount.value = count;
  const url = new URL(window.location.href);
  if (count) url.searchParams.set("colors", String(count));
  else url.searchParams.delete("colors");
  history.replaceState(history.state, "", url);
}

const filteredPalettes = computed(() =>
  (palettes.value || []).filter(
    (palette) =>
      !activeCount.value || palette.colors.length === activeCount.value,
  ),
);

// The block that was just copied, as "<palette id>:<index>".
const copied = ref<string | null>(null);
let copiedTimer: ReturnType<typeof setTimeout> | undefined;

async function copy(paletteId: string, index: number, hex: string) {
  try {
    await navigator.clipboard.writeText(hex);
  } catch {
    return;
  }
  copied.value = `${paletteId}:${index}`;
  clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => (copied.value = null), 1200);
}

onUnmounted(() => clearTimeout(copiedTimer));
</script>

<template>
  <div class="intro | grid">
    <div class="col">
      <h1 class="heading-2">
        A collection of color combinations from the works we love. Click a color
        to copy its hex code.
      </h1>
    </div>
  </div>

  <div class="color-filter | grid">
    <div class="color-filter__list | col" data-grid="df:12">
      <button
        type="button"
        class="button color-filter__button"
        :class="{ active: !activeCount }"
        :aria-pressed="!activeCount"
        @click="setCount(null)"
      >
        All
      </button>
      <button
        v-for="count in COUNTS"
        :key="count"
        type="button"
        class="button color-filter__button"
        :class="{ active: activeCount === count }"
        :aria-pressed="activeCount === count"
        @click="setCount(count)"
      >
        {{ count }} Colors
      </button>
    </div>
  </div>

  <section class="section">
    <p v-if="!filteredPalettes.length" class="grid">
      <span class="col" data-grid="df:12">No color combinations here yet.</span>
    </p>
    <div v-else class="palette-grid | grid">
      <figure
        v-for="palette in filteredPalettes"
        :key="palette._id"
        class="palette"
      >
        <div class="palette__colors">
          <button
            v-for="(hex, index) in palette.colors"
            :key="index"
            type="button"
            class="palette__color"
            :style="{ background: hex, color: readableTextColor(hex) }"
            :aria-label="`Copy ${hex.toUpperCase()}`"
            data-cursor-hover
            :data-cursor-text="
              copied === `${palette._id}:${index}` ? 'Copied' : 'Copy color'
            "
            @click="copy(palette._id, index, hex.toUpperCase())"
          >
            <span class="palette__hex" aria-live="polite">
              {{
                copied === `${palette._id}:${index}`
                  ? "Copied"
                  : hex.toUpperCase()
              }}
            </span>
          </button>
        </div>
        <figcaption class="palette__caption">
          {{ paletteId(palette.number) }}
        </figcaption>
      </figure>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use "~~/assets/scss/2-tools" as *;

.color-filter {
  margin-bottom: var(--space-6);

  @include maxbp(sm) {
    margin-bottom: var(--space-4);
  }
}

.color-filter__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.color-filter__button {
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

// Gaps and page margins come from .grid, like the font grid; only the column count differs.
.palette-grid {
  grid-template-columns: minmax(0, 1fr);

  @include bp(xs) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @include bp(md) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.palette {
  margin: 0;
  min-width: 0;
  // On the card rather than the caption, so palettes without one keep the same gap.
  padding-bottom: var(--space-3);
  transition: 0.6s ease opacity;
}

.palette-grid:has(.palette:hover) .palette:not(:hover) {
  opacity: 0.2;
}

// Equal-width color blocks, one card shape no matter how many colors.
.palette__colors {
  display: flex;
  aspect-ratio: 4 / 3;
}

.palette__color {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: flex-end;
  padding: var(--space-1);
  border: 0;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: -2px;
    box-shadow: inset 0 0 0 4px var(--color-secondary);
  }
}

.palette__hex {
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0.8;
  transition: opacity var(--speed-fast);

  @include bp(sm) {
    font-size: var(--size--1);
  }
}

.palette__color:hover .palette__hex {
  opacity: 1;
}

.palette__caption {
  margin-top: var(--space-1);
}
</style>
