<script setup lang="ts">
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
  <section ref="header" class="header-section | section">
    <div class="header | grid">
      <div class="header__logo | col" data-grid="sm:6  lg:4">
        <NuxtLink to="/">Aetyc</NuxtLink><br />
      </div>
      <div class="header__desc | col" data-grid="df:12 sm:6 lg:2">
        A weekly showcase of exceptional Design, Art, Photography, and
        Architecture.
      </div>
      <div class="header__offset | col" data-grid="lg:1"></div>
      <div class="header__meta | col" data-grid="df:12 sm:6lg:3">
        Selected by Dirk Lach
      </div>
      <div class="header__cta | col" data-grid="df:12 sm:6 md:3 lg:2">
        <NewsletterForm />
      </div>
    </div>
  </section>
</template>
