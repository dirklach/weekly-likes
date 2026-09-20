<script setup lang="ts">
const route = useRoute();
const { zoomedOut, canZoom } = useSitePrefs();
const collapsed = computed(
  () =>
    canZoom.value &&
    zoomedOut.value &&
    !route.name?.toString().startsWith("edition-slug"),
);
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
      <div class="header__desc | col" data-grid="df:12 sm:6 md:3">
        (Catalog of visual culture)
      </div>
      <div class="header__meta | col" data-grid="df:12 sm:6 md:5">
        <div class="menu">
          <a href="#" class="menu-item | menu-link">Info</a>
          <span>, </span>
          <a href="#" class="menu-item | menu-link --active"
            >The Weekly Likes</a
          >
        </div>
      </div>
      <div class="header__cta | col" data-grid="df:12 sm:6 md:3">
        <NewsletterForm />
      </div>
    </div>
  </section>
</template>
