<script setup lang="ts">
const route = useRoute();
const isPick = computed(() =>
  route.name?.toString().startsWith("edition-slug"),
);
</script>

<template>
  <div>
    <div id="page-dimmer" class="dimmer"></div>

    <DemoGrid />
    <Header />
    <main class="page">
      <slot />
    </main>
    <Metabar :show-credits="!isPick" :show-back="isPick" />
  </div>
</template>
