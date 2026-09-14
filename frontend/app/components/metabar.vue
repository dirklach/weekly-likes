<script setup lang="ts">
const {
  hideCredits,
  darkMode,
  zoomedOut,
  toggleCredits,
  toggleDarkMode,
  toggleZoom,
} = useSitePrefs();

const props = withDefaults(
  defineProps<{
    showCredits?: boolean;
    showBack?: boolean;
  }>(),
  { showCredits: true, showBack: false },
);

useHead({
  htmlAttrs: {
    class: computed(() => (darkMode.value ? "dark" : undefined)),
  },
});

function onMetabarKeydown(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;

  const target = event.target as HTMLElement | null;
  if (target?.closest("input, textarea, select, [contenteditable='true']"))
    return;

  if (props.showBack && event.key === "Escape") {
    event.preventDefault();
    navigateTo("/");
    return;
  }

  if (props.showCredits && (event.key === "c" || event.key === "C")) {
    event.preventDefault();
    toggleCredits();
    return;
  }

  if (event.key === "d" || event.key === "D") {
    event.preventDefault();
    toggleDarkMode();
    return;
  }

  if (props.showCredits && (event.key === "z" || event.key === "Z")) {
    event.preventDefault();
    toggleZoom();
  }
}

onMounted(() => {
  document.addEventListener("keydown", onMetabarKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", onMetabarKeydown);
});
</script>

<template>
  <div class="metabar">
    <div v-if="showBack" class="button" @click="navigateTo('/')">
      (ESC) Back to overview
    </div>
    <div v-if="showCredits" class="button" @click="toggleCredits">
      (C) {{ hideCredits ? "Show" : "Hide" }} Info
    </div>
    <div v-if="showCredits" class="button" @click="toggleZoom">
      (Z) {{ zoomedOut ? "Zoom in" : "Zoom out" }}
    </div>
    <div class="button" @click="toggleDarkMode">
      (D) {{ darkMode ? "Light" : "Dark" }} Mode
    </div>
  </div>
</template>
