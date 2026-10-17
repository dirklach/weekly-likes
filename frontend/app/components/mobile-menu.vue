<script setup lang="ts">
// Phone navigation: a burger in the header opens a panel that slides in from the right over a
// darkened page. Tapping outside the panel, the close icon, Escape or any link closes it.
const LINKS = [
  { to: "/info", label: "Info" },
  { to: "/gallery", label: "Gallery" },
  { to: "/fonts", label: "Fonts" },
  { to: "/colors", label: "Colors" },
  { to: "/submit", label: "Submit" },
];

const route = useRoute();
const lenis = useLenis();

const open = ref(false);
const burger = ref<HTMLButtonElement | null>(null);
const closeButton = ref<HTMLButtonElement | null>(null);

// Detail pages aren't nested routes, so mark their section by hand.
function isActive(to: string) {
  if (route.path === to || route.path.startsWith(`${to}/`)) return true;
  return to === "/gallery" && !!route.name?.toString().startsWith("edition-slug");
}

function close() {
  open.value = false;
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") close();
};

watch(open, async (isOpen) => {
  if (isOpen) {
    lenis.value?.stop();
    document.addEventListener("keydown", onKeydown);
    await nextTick();
    closeButton.value?.focus();
  } else {
    lenis.value?.start();
    document.removeEventListener("keydown", onKeydown);
    burger.value?.focus({ preventScroll: true });
  }
});

watch(() => route.fullPath, close);

onUnmounted(() => {
  if (open.value) lenis.value?.start();
  document.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <div class="mobile-menu | col">
    <button
      ref="burger"
      type="button"
      class="mobile-menu__burger"
      aria-label="Open menu"
      aria-controls="mobile-menu-panel"
      :aria-expanded="open"
      @click="open = true"
    >
      <span />
      <span />
      <span />
    </button>

    <Teleport to="body">
      <Transition name="mobile-menu">
        <div
          v-if="open"
          class="mobile-menu__overlay"
          @click.self="close"
        >
          <nav
            id="mobile-menu-panel"
            class="mobile-menu__panel"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <button
              ref="closeButton"
              type="button"
              class="mobile-menu__close"
              aria-label="Close menu"
              @click="close"
            >
              <span />
              <span />
            </button>
            <ul class="mobile-menu__list">
              <li v-for="link in LINKS" :key="link.to">
                <NuxtLink
                  :to="link.to"
                  class="mobile-menu__link"
                  :class="{ active: isActive(link.to) }"
                  :aria-current="isActive(link.to) ? 'page' : undefined"
                  @click="close"
                >
                  {{ link.label }}
                </NuxtLink>
              </li>
            </ul>
          </nav>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
@use "~~/assets/scss/2-tools" as *;

$ease: cubic-bezier(0.625, 0.05, 0, 1);

// Phones only; from sm up the header shows the inline menu.
.mobile-menu {
  display: flex;
  justify-content: end;
  align-items: center;

  @include bp(sm) {
    display: none;
  }
}

.mobile-menu__burger {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-primary);
  cursor: pointer;

  span {
    display: block;
    width: 100%;
    height: 1.5px;
    background: currentColor;
  }
}

.mobile-menu__overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgb(0 0 0 / 0.5);
}

// Inverted colours: dark panel in light mode, light panel in dark mode.
.mobile-menu__panel {
  position: absolute;
  inset: 0 0 0 auto;
  width: 90%;
  display: flex;
  flex-direction: column;
  padding: var(--space-1) var(--default-page-padding) var(--space-4);
  background: var(--color-primary);
  color: var(--color-secondary);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.mobile-menu__close {
  position: relative;
  align-self: end;
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

.mobile-menu__list {
  display: flex;
  flex-direction: column;
  gap: 0.15em;
  margin: auto 0 0;
  padding: 0;
  list-style: none;
  font-size: clamp(2.75rem, 13vw, 4rem);
  line-height: 1.05;
}

.mobile-menu__link {
  color: inherit;
  text-decoration: none;
  opacity: 0.45;
  transition: opacity 0.3s ease;

  &.active,
  &:hover,
  &:focus-visible {
    opacity: 1;
  }

  &:focus-visible {
    outline: 0;
    text-decoration: underline;
    text-underline-offset: 0.12em;
    text-decoration-thickness: 2px;
  }
}

// Backdrop fades while the panel slides in from the right.
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: background-color 0.6s ease;

  .mobile-menu__panel {
    transition: transform 0.6s $ease;
  }
}

.mobile-menu-leave-active {
  transition-duration: 0.4s;

  .mobile-menu__panel {
    transition-duration: 0.4s;
  }
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  background-color: rgb(0 0 0 / 0);

  .mobile-menu__panel {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mobile-menu-enter-from .mobile-menu__panel,
  .mobile-menu-leave-to .mobile-menu__panel {
    transform: none;
  }
}
</style>
