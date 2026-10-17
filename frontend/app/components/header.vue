<script setup lang="ts">
const route = useRoute();
const { zoomedOut, canZoom } = useSitePrefs();
const isOverview = computed(() => route.path === "/weekly");
const isHome = computed(() => route.name === "index");
const isInfo = computed(() => route.path === "/info");
const collapsed = computed(
  () => canZoom.value && zoomedOut.value && isOverview.value,
);
// Detail pages aren't nested routes, so the router won't mark their menu item active on its own.
const activeSection = computed(() => {
  if (
    route.path === "/fonts" ||
    route.path.startsWith("/fonts/") ||
    route.path === "/colors"
  )
    return "resources";
  if (
    route.path === "/weekly" ||
    route.path.startsWith("/weekly/") ||
    route.name?.toString().startsWith("edition-slug")
  )
    return "weekly";
  return null;
});
const sectionLink = (section: string) =>
  activeSection.value === section
    ? {
        class: "router-link-active router-link-exact-active",
        "aria-current": "page" as const,
      }
    : {};
const header = ref<HTMLElement | null>(null);

// Resources submenu: opens on mouse hover, keyboard focus, or tap/Enter on its toggle.
const resources = ref<HTMLElement | null>(null);
const resourcesOpen = ref(false);
let lastPointer = "";
let restoringFocus = false;

const onResourcesPointerEnter = (e: PointerEvent) => {
  if (e.pointerType === "mouse") resourcesOpen.value = true;
};
const onResourcesPointerLeave = (e: PointerEvent) => {
  if (e.pointerType === "mouse") resourcesOpen.value = false;
};
const onResourcesFocusIn = (e: FocusEvent) => {
  if (!restoringFocus && (e.target as HTMLElement).matches(":focus-visible"))
    resourcesOpen.value = true;
};
const onResourcesFocusOut = (e: FocusEvent) => {
  if (!resources.value?.contains(e.relatedTarget as Node | null))
    resourcesOpen.value = false;
};
// A mouse click lands while the hover has already opened the menu, so it shouldn't close it again.
const onResourcesToggle = () => {
  resourcesOpen.value = lastPointer === "mouse" ? true : !resourcesOpen.value;
  lastPointer = "";
};
const onResourcesKeydown = (e: KeyboardEvent) => {
  if (e.key !== "Escape" || !resourcesOpen.value) return;
  resourcesOpen.value = false;
  restoringFocus = true;
  resources.value?.querySelector<HTMLElement>(".menu-toggle")?.focus();
  restoringFocus = false;
};
const onDocumentPointerDown = (e: PointerEvent) => {
  if (!resources.value?.contains(e.target as Node)) resourcesOpen.value = false;
};

watch(
  () => route.path,
  () => (resourcesOpen.value = false),
);

onMounted(() => {
  document.addEventListener("pointerdown", onDocumentPointerDown);
  onUnmounted(() =>
    document.removeEventListener("pointerdown", onDocumentPointerDown),
  );

  const el = header.value;
  if (!el) return;

  const setHeight = () => {
    document.documentElement.style.setProperty(
      "--header-height",
      `${el.offsetHeight}px`,
    );
  };

  setHeight();
  const observer = new ResizeObserver(setHeight);
  observer.observe(el);

  onUnmounted(() => {
    observer.disconnect();
    document.documentElement.style.removeProperty("--header-height");
  });
});
</script>

<template>
  <section
    ref="header"
    class="header-section | section"
    :aria-hidden="collapsed"
    :inert="collapsed"
  >
    <div class="grid">
      <div class="header__logo | col" data-grid="sm:6 md:1">
        <NuxtLink to="/">Aetyc</NuxtLink><br />
      </div>
      <div
        class="header__desc --claim | col"
        :class="{ '--hidden': isHome }"
        data-grid="df:12 sm:6 md:3"
      >
        Exploring visual culture
      </div>
      <div class="header__meta | col" data-grid="df:12 sm:6 md:5">
        <div class="menu">
          <NuxtLink to="/info" class="menu-item | menu-link"> Info </NuxtLink>
          <NuxtLink
            to="/weekly"
            class="menu-item | menu-link"
            v-bind="sectionLink('weekly')"
          >
            Weekly
          </NuxtLink>
          <div
            ref="resources"
            class="menu-group"
            :class="{ '--open': resourcesOpen }"
            @pointerenter="onResourcesPointerEnter"
            @pointerleave="onResourcesPointerLeave"
            @focusin="onResourcesFocusIn"
            @focusout="onResourcesFocusOut"
            @keydown="onResourcesKeydown"
          >
            <button
              type="button"
              class="menu-item | menu-link | menu-toggle"
              aria-controls="menu-resources"
              :aria-expanded="resourcesOpen"
              :class="{ 'router-link-active': activeSection === 'resources' }"
              @pointerdown="lastPointer = $event.pointerType"
              @click="onResourcesToggle"
            >
              Supply
            </button>
            <div id="menu-resources" class="menu-submenu">
              <NuxtLink
                to="/fonts"
                class="menu-item | menu-link"
                :class="{
                  'router-link-active': route.path.startsWith('/fonts/'),
                }"
              >
                Fonts
              </NuxtLink>
              <NuxtLink to="/colors" class="menu-item | menu-link">
                Colors
              </NuxtLink>
            </div>
          </div>
          <NuxtLink to="/submit" class="menu-item | menu-link">
            Submit
          </NuxtLink>
        </div>
      </div>
      <div
        class="header__cta | col"
        :class="{ '--home': isHome }"
        data-grid="df:12 sm:6 md:3"
      >
        <NewsletterForm />
      </div>
    </div>
  </section>
</template>
