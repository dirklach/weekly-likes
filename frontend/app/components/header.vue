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
  if (route.path === "/fonts" || route.path.startsWith("/fonts/"))
    return "fonts";
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

onMounted(() => {
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
        data-grid="df:12 sm:6 md:3"
        :style="{ visibility: isHome ? 'hidden' : undefined }"
      >
        Exploring visual culture
      </div>
      <div class="header__meta | col" data-grid="df:12 sm:6 md:5">
        <div class="menu">
          <NuxtLink to="/info" class="menu-item | menu-link"> Info </NuxtLink>
          <span>, </span>
          <NuxtLink
            to="/weekly"
            class="menu-item | menu-link"
            v-bind="sectionLink('weekly')"
          >
            Weekly
          </NuxtLink>
          <span>, </span>
          <NuxtLink
            to="/fonts"
            class="menu-item | menu-link"
            v-bind="sectionLink('fonts')"
          >
            Fonts
          </NuxtLink>
          <span>, </span>
          <NuxtLink to="/submit" class="menu-item | menu-link">
            Submit
          </NuxtLink>
        </div>
      </div>
      <div class="header__cta | col" data-grid="df:12 sm:6 md:3">
        <NewsletterForm />
      </div>
    </div>
  </section>
</template>
