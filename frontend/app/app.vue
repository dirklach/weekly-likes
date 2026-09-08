<script setup lang="ts">
const route = useRoute()
const lenis = useLenis()

watch(
  () => route.fullPath,
  () => {
    lenis.value?.scrollTo(0, {immediate: true})
  },
)
</script>

<template>
  <VueLenis
    root
    :options="{
      autoRaf: true,
      anchors: true,
      stopInertiaOnNavigate: true,
    }"
  />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
