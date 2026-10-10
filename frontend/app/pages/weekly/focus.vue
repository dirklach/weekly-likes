<script setup lang="ts">
import type { Edition, EditionPick } from "~/types/content";

const SWIPE_THRESHOLD = 50;

usePageSeo({
  title: "Focus – Weekly Likes | Aetyc",
  description:
    "One Weekly Likes pick at a time, picked at random. Browse through every work in design, art, architecture, and photography.",
});

const { data: editions } = await useEditions();

const entries = computed(() =>
  (editions.value || []).flatMap((edition) =>
    (edition.picks || []).map((pick) => ({
      key: `${edition._id}:${pick._key}`,
      edition,
      pick,
    })),
  ),
);

// Shuffled once per page load (on the server, reused on the client to avoid hydration
// mismatches): a random start, and every pick comes up once before any repeats.
const order = useState<string[]>("focus-order", () =>
  shuffled(entries.value.map((entry) => entry.key)),
);
const position = useState("focus-position", () => 0);

const byKey = computed(
  () => new Map(entries.value.map((entry) => [entry.key, entry])),
);
const at = (offset: number) => {
  const keys = order.value;
  if (!keys.length) return null;
  const index = (position.value + offset + keys.length) % keys.length;
  return byKey.value.get(keys[index]!) ?? null;
};
const current = computed(() => at(0));
const neighbours = computed(() =>
  [at(-1), at(1)].filter(
    (entry): entry is { key: string; edition: Edition; pick: EditionPick } =>
      !!entry && entry.key !== current.value?.key,
  ),
);

// Author, category and week after the title; "Unknown" authors are left out.
const details = (entry: { edition: Edition; pick: EditionPick }) => {
  const authors = authorNames(entry.pick);
  return [
    authors === "Unknown" ? "" : authors,
    entry.pick.category?.name ?? "",
    `Week ${entry.edition.number}`,
  ].filter(Boolean);
};

const direction = ref<"next" | "prev">("next");
function step(offset: 1 | -1) {
  if (!order.value.length) return;
  direction.value = offset > 0 ? "next" : "prev";
  position.value =
    (position.value + offset + order.value.length) % order.value.length;
}

function onKeydown(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest("input, textarea, select, [contenteditable='true']"))
    return;
  if (event.key === "ArrowRight") {
    event.preventDefault();
    step(1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    step(-1);
  }
}

let touchStart: { x: number; y: number } | null = null;
function onTouchStart(event: TouchEvent) {
  const touch = event.touches[0];
  touchStart = touch ? { x: touch.clientX, y: touch.clientY } : null;
}
function onTouchEnd(event: TouchEvent) {
  const touch = event.changedTouches[0];
  if (!touchStart || !touch) return;
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  touchStart = null;
  // Only clearly horizontal swipes, so vertical scrolling keeps working.
  if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.5)
    return;
  step(dx < 0 ? 1 : -1);
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <section class="section">
    <div class="focus | grid">
      <div
        v-if="current"
        class="focus__stage | col"
        data-grid="df:12"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
      >
        <Transition :name="`focus-${direction}`" mode="out-in">
          <NuxtLink
            :key="current.key"
            :to="pickHref(current.edition, current.pick)"
            class="focus__image | pick-image__inner"
          >
            <PickImage
              v-if="current.pick.image?.asset?._ref"
              :asset-id="current.pick.image.asset._ref"
              :alt="current.pick.image.alt || current.pick.title"
              sizes="(min-width: 1024px) 66vw, 100vw"
              loading="eager"
            />
          </NuxtLink>
        </Transition>

        <Transition :name="`focus-${direction}`" mode="out-in">
          <p :key="current.key" class="focus__line">
            <NuxtLink :to="pickHref(current.edition, current.pick)">
              {{ current.pick.title }}
            </NuxtLink>
            <template v-for="part in details(current)" :key="part">
              <span class="focus__dot" aria-hidden="true">·</span>
              <span>{{ part }}</span>
            </template>
          </p>
        </Transition>

        <!-- Below 1024px: arrows in the flow, under the text line. -->
        <div class="focus__nav">
          <button
            type="button"
            class="button focus__arrow"
            aria-label="Previous pick"
            @click="step(-1)"
          >
            ←
          </button>
          <button
            type="button"
            class="button focus__arrow"
            aria-label="Next pick"
            @click="step(1)"
          >
            →
          </button>
        </div>

        <!-- Neighbours load ahead, so stepping through shows images right away. -->
        <div class="focus__preload" aria-hidden="true">
          <template v-for="entry in neighbours" :key="entry.key">
            <PickImage
              v-if="entry.pick.image?.asset?._ref"
              :asset-id="entry.pick.image.asset._ref"
              sizes="(min-width: 1024px) 66vw, 100vw"
              loading="eager"
            />
          </template>
        </div>
      </div>
    </div>

    <!-- From 1024px: fixed to the screen edges; teleported so page transitions don't
         move them. -->
    <Teleport to="body">
      <button
        type="button"
        class="button focus__arrow focus__arrow--edge focus__arrow--prev"
        aria-label="Previous pick"
        @click="step(-1)"
      >
        ←
      </button>
      <button
        type="button"
        class="button focus__arrow focus__arrow--edge focus__arrow--next"
        aria-label="Next pick"
        @click="step(1)"
      >
        →
      </button>
    </Teleport>
  </section>
</template>

<style scoped lang="scss">
@use "~~/assets/scss/2-tools" as *;

.focus__stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  touch-action: pan-y;

  // Phones: centre the image in the free screen height, level with the arrows.
  @include maxbp(sm) {
    justify-content: center;
    min-height: calc(
      100dvh - 2 * var(--header-height, 3rem) - 2 * var(--space-5)
    );
  }
}

// Centred, and as large as fits between the header and the metabar.
.focus__image {
  display: flex;
  width: 100%;

  // Tablets: the header is still in the flow and the arrows sit under the text line.
  @include bp(sm) {
    width: min(
      100%,
      calc((100dvh - var(--header-height, 10rem) - 20vh - 14rem) * 16 / 9)
    );
  }

  // From 1024px the header is fixed (the page padding clears it) and the arrows move
  // to the screen edges.
  @include bp(md) {
    width: min(100%, calc((100dvh - 20vh - 7rem) * 16 / 9));
  }
}

.focus__line {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  column-gap: 0.5em;
  text-align: center;
}

.focus__title {
  color: var(--color-primary);
}

// Below 1024px the arrows sit under the text line, from 1024px at the screen edges.
.focus__nav {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-4);

  @include bp(md) {
    display: none;
  }
}

.focus__arrow {
  font: inherit;
  font-size: 1.25rem;
  line-height: 1;
  border: 0;
  padding: 10px 16px;
}

.focus__arrow--edge {
  display: none;
  position: fixed;
  top: 50%;
  z-index: 10;
  transform: translateY(-50%);

  @include bp(md) {
    display: block;
  }
}

.focus__arrow--prev {
  left: var(--default-page-padding);
}

.focus__arrow--next {
  right: var(--default-page-padding);
}

.focus__preload {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

// Slides move in the direction of travel.
.focus-next-enter-active,
.focus-next-leave-active,
.focus-prev-enter-active,
.focus-prev-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease-in-out;
}

.focus-next-enter-from,
.focus-prev-leave-to {
  opacity: 0;
  transform: translateX(16px);
}

.focus-next-leave-to,
.focus-prev-enter-from {
  opacity: 0;
  transform: translateX(-16px);
}

@media (prefers-reduced-motion: reduce) {
  .focus-next-enter-active,
  .focus-next-leave-active,
  .focus-prev-enter-active,
  .focus-prev-leave-active {
    transition: opacity 0.2s ease;
  }

  .focus-next-enter-from,
  .focus-next-leave-to,
  .focus-prev-enter-from,
  .focus-prev-leave-to {
    transform: none;
  }
}
</style>
