<script setup lang="ts">
const route = useRoute()
const isPick = computed(() => route.path === "/pick" || route.path.startsWith("/pick/"))
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
