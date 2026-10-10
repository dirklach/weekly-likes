<script setup lang="ts">
import type { CanvasItem } from "~/lib/infinite-canvas";

const TEXTURE_WIDTH = 640;
// Used only while a plane is close to the camera.
const TEXTURE_WIDTH_LARGE = 1280;

usePageSeo({
  title: "Infinity – Weekly Likes | Aetyc",
  description:
    "Every Weekly Likes pick on one endless canvas. Drag to explore, scroll to fly through.",
});

const { data: editions } = await useEditions();
const sanity = useSanity();
const { darkMode } = useSitePrefs();
const lenis = useLenis();

const items = computed<CanvasItem[]>(() =>
  (editions.value || []).flatMap((edition) =>
    (edition.picks || []).flatMap((pick) => {
      const assetId = pick.image?.asset?._ref;
      const parsed = assetId ? parseAssetId(assetId) : null;
      if (!assetId || !parsed) return [];
      return [
        {
          src: sanityImageUrl(
            assetId,
            sanity.config.projectId,
            sanity.config.dataset || "production",
            TEXTURE_WIDTH,
          ),
          srcLarge: sanityImageUrl(
            assetId,
            sanity.config.projectId,
            sanity.config.dataset || "production",
            TEXTURE_WIDTH_LARGE,
          ),
          width: parsed.width,
          height: parsed.height,
          href: pickHref(edition, pick),
        },
      ];
    }),
  ),
);

const container = ref<HTMLElement | null>(null);
let canvas: { setBackground: (color: string) => void; destroy: () => void } | null =
  null;

const backgroundColor = () =>
  getComputedStyle(document.documentElement)
    .getPropertyValue("--color-secondary")
    .trim() || "#fff";

onMounted(async () => {
  // The canvas takes the wheel; the page itself shouldn't scroll underneath.
  lenis.value?.stop();
  // three.js only loads on this page.
  const { createInfiniteCanvas } = await import("~/lib/infinite-canvas");
  if (!container.value || !items.value.length) return;
  canvas = createInfiniteCanvas(container.value, items.value, {
    background: backgroundColor(),
    onNavigate: (href) => navigateTo(href),
  });
});

// The html.dark class (and with it the colour variables) updates after the cookie.
watch(darkMode, () => nextTick(() => canvas?.setBackground(backgroundColor())));

onBeforeUnmount(() => {
  canvas?.destroy();
  canvas = null;
  lenis.value?.start();
});
</script>

<template>
  <div ref="container" class="infinity" aria-label="All picks on an endless canvas" />
</template>

<style scoped lang="scss">
.infinity {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}
</style>
