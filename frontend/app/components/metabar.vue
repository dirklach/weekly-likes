<script setup lang="ts">
const {
  hideCredits,
  darkMode,
  zoomedOut,
  toggleCredits,
  toggleDarkMode,
  toggleZoom,
  fontColumns,
  cycleFontColumns,
} = useSitePrefs();

const props = withDefaults(
  defineProps<{
    showCredits?: boolean;
    showBack?: boolean;
    showInfinity?: boolean;
    infinityActive?: boolean;
    showFocus?: boolean;
    focusActive?: boolean;
    showGrid?: boolean;
  }>(),
  {
    showCredits: true,
    showBack: false,
    showInfinity: false,
    infinityActive: false,
    showFocus: false,
    focusActive: false,
    showGrid: false,
  },
);

const route = useRoute();

function goBackToOverview() {
  if (route.path.startsWith("/fonts/")) return navigateTo("/fonts");
  const edition = route.params.edition;
  if (typeof edition === "string" && edition) {
    return navigateTo({ path: "/gallery", hash: `#${edition}` });
  }
  return navigateTo("/gallery");
}

function toggleInfinity() {
  return navigateTo(props.infinityActive ? "/gallery" : "/gallery/infinity");
}

function toggleFocus() {
  return navigateTo(props.focusActive ? "/gallery" : "/gallery/focus");
}

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
    goBackToOverview();
    return;
  }

  if (props.showCredits && (event.key === "c" || event.key === "C")) {
    event.preventDefault();
    toggleCredits();
    return;
  }

  if (props.showFocus && (event.key === "f" || event.key === "F")) {
    event.preventDefault();
    toggleFocus();
    return;
  }

  if (props.showInfinity && (event.key === "i" || event.key === "I")) {
    event.preventDefault();
    toggleInfinity();
    return;
  }

  if (props.showGrid && (event.key === "g" || event.key === "G")) {
    event.preventDefault();
    cycleFontColumns();
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
    <div v-if="showBack" class="button" @click="goBackToOverview">
      <span class="button__key">(ESC) </span>Back to overview
    </div>
    <div
      v-if="showCredits"
      class="button button--credits"
      @click="toggleCredits"
    >
      <span class="button__key">(C) </span>{{ hideCredits ? "Show" : "Hide" }} Info
    </div>
    <div
      v-if="showCredits"
      class="button button--zoom"
      :class="{ active: zoomedOut }"
      @click="toggleZoom"
    >
      <span class="button__key">(Z) </span>{{ zoomedOut ? "Zoom in" : "Zoom out" }}
    </div>
    <div
      v-if="showFocus"
      class="button button--toggle"
      :class="{ active: focusActive }"
      @click="toggleFocus"
    >
      <span class="button__key">(F) </span>Focus
    </div>
    <div
      v-if="showInfinity"
      class="button button--toggle"
      :class="{ active: infinityActive }"
      @click="toggleInfinity"
    >
      <span class="button__key">(I) </span>Infinity
    </div>
    <div v-if="showGrid" class="button button--grid" @click="cycleFontColumns">
      <span class="button__key">(G) </span>Grid: {{ fontColumns }}
    </div>
    <div class="button" @click="toggleDarkMode">
      <span class="button__key">(D) </span>{{ darkMode ? "Light" : "Dark" }} Mode
    </div>
  </div>
</template>
