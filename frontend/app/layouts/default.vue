<script setup lang="ts">
const route = useRoute();
const { zoomedOut } = useSitePrefs();
const isOverview = computed(() => route.path === "/");
const isPick = computed(() =>
  route.name?.toString().startsWith("edition-slug"),
);
</script>

<template>
  <div :class="{ 'is-zoomed-out': zoomedOut && isOverview }">
    <div id="page-dimmer" class="dimmer"></div>

    <DemoGrid />
    <Header />
    <main class="page">
      <slot />
    </main>
    <Metabar :show-credits="isOverview" :show-back="isPick" />
  </div>
</template>
