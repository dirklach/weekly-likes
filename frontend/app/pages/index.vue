<script setup lang="ts">
const { hideCredits, zoomedOut } = useSitePrefs();
const creditsHidden = computed(() => hideCredits.value);
const { data: editions } = await useEditions();
</script>

<template>
  <div class="intro intro--home | grid">
    <div class="col">
      <h1 class="heading-1">
        Showcasing visual culture including design, art, architecture, and
        photography. (Est. 2025)
      </h1>
    </div>
  </div>
  <div class="grid">
    <div class="col">Weekly Likes</div>
  </div>
</template>
