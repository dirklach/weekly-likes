<script setup lang="ts">
const route = useRoute();
const { zoomedOut } = useSitePrefs();
const isOverview = computed(() => route.path === "/weekly");
const isPick = computed(() =>
  route.name?.toString().startsWith("edition-slug"),
);
const isInfinity = computed(() => route.path === "/weekly/infinity");
</script>

<template>
  <div
    :class="{
      'is-zoomed-out': zoomedOut && isOverview,
      'is-infinity': isInfinity,
    }"
  >
    <div id="page-dimmer" class="dimmer"></div>

    <DemoGrid />
    <Header />
    <main class="page">
      <slot />
    </main>
    <Footer />
    <Metabar
      :show-credits="isOverview"
      :show-back="isPick || isInfinity"
      :show-infinity="isOverview || isInfinity"
      :infinity-active="isInfinity"
    />
  </div>
</template>
