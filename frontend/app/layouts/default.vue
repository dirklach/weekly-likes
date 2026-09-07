<script setup lang="ts">
const route = useRoute()
const isPick = computed(() => /^\/\d{3}(\/|$)/.test(route.path))
</script>

<template>
  <div>
    <DemoGrid />

    <Header />

    <main class="page">
      <slot />
    </main>

    <Metabar :show-credits="!isPick" :show-back="isPick" />
  </div>
</template>
