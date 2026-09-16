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
    <div class="grid">
      <div class="header__logo | col" data-grid="sm:6 md:1">
        <NuxtLink to="/">Aetyc</NuxtLink><br />
      </div>
      <div class="header__desc | col" data-grid="df:12 sm:6 md:3">
        Driven by good design.
      </div>
      <div class="header__meta | col" data-grid="df:12 sm:6 md:5">
        <div class="menu">
          <a href="#" class="menu-item | menu-link --active">Weekly</a
          ><span>, </span> <a href="#" class="menu-item | menu-link">Supply</a
          ><span>, </span>
          <a href="#" class="menu-item | menu-link">About</a>
        </div>
      </div>
      <div class="header__cta | col" data-grid="df:12 sm:6 md:3">
        <NewsletterForm />
      </div>
    </div>
  </section>
</template>
