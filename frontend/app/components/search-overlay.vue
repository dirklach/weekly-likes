<script setup lang="ts">
// Fullscreen search: a single input, results update while typing. Escape, the close button
// or following a result closes it.
const { searchOpen, closeSearch } = useSearch();
const route = useRoute();
const lenis = useLenis();

const input = ref<HTMLInputElement | null>(null);
const draft = ref("");
// The input, settled for a moment, so the grids don't redraw on every keystroke.
const query = ref("");
let debounce: ReturnType<typeof setTimeout> | undefined;
watch(draft, (value) => {
  clearTimeout(debounce);
  debounce = setTimeout(() => (query.value = value.trim()), 150);
});

// Enter just puts the keyboard away on phones; the results are already there.
function submit() {
  clearTimeout(debounce);
  query.value = draft.value.trim();
  input.value?.blur();
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") closeSearch();
};

watch(searchOpen, async (isOpen) => {
  if (isOpen) {
    lenis.value?.stop();
    document.addEventListener("keydown", onKeydown);
    await nextTick();
    input.value?.focus();
  } else {
    lenis.value?.start();
    document.removeEventListener("keydown", onKeydown);
  }
});

watch(() => route.fullPath, closeSearch);

onUnmounted(() => {
  clearTimeout(debounce);
  if (searchOpen.value) lenis.value?.start();
  document.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="search">
      <div
        v-if="searchOpen"
        class="search"
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        data-lenis-prevent
      >
        <div class="search__bar | grid">
          <form
            class="search__form | col"
            data-grid="df:12"
            @submit.prevent="submit"
          >
            <input
              ref="input"
              v-model="draft"
              type="search"
              class="search__input"
              placeholder="Search"
              aria-label="Search picks and fonts"
              autocomplete="off"
              enterkeyhint="search"
            />
            <button
              type="button"
              class="search__close"
              aria-label="Close search"
              @click="closeSearch"
            >
              <span />
              <span />
            </button>
          </form>
        </div>

        <SearchResults v-if="query" :query="query" />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
@use "~~/assets/scss/2-tools" as *;

.search {
  position: fixed;
  inset: 0;
  z-index: 2000;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-bottom: var(--space-6);
  background: var(--color-secondary);
  color: var(--color-primary);
}

.search__bar {
  position: sticky;
  top: 0;
  z-index: 1;
  padding-top: var(--space-2);
  padding-bottom: var(--space-2);
  margin-bottom: var(--space-4);
  background: var(--color-secondary);
}

.search__form {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding-right: calc(28px + 2rem);
}

// No box, no chrome: just large type on a hairline.
.search__input {
  flex: 1;
  min-width: 0;
  padding: 0 0 0.15em;
  border: 0;
  outline: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-size: clamp(2.5rem, 7vw, 5rem);
  line-height: 1.1;
  appearance: none;

  &::placeholder {
    color: inherit;
    opacity: 0.25;
  }

  &::-webkit-search-cancel-button {
    display: none;
  }
}

// Pinned to the viewport corner (the overlay itself is fixed, so this stays put while results
// scroll); the form keeps room on the right so long queries don't run underneath it.
.search__close {
  position: fixed;
  top: 2rem;
  right: 2rem;
  z-index: 1;
  width: 28px;
  height: 28px;
  flex: none;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;

  span {
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 1.5px;
    background: currentColor;
    transform: rotate(45deg);

    & + span {
      transform: rotate(-45deg);
    }
  }
}

.search-enter-active,
.search-leave-active {
  transition: opacity 0.4s ease;
}

.search-enter-from,
.search-leave-to {
  opacity: 0;
}
</style>
