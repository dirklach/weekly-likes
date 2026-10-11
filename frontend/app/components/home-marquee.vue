<script setup lang="ts">
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Edition, EditionPick, Font } from "~/types/content";

export type MarqueeItem =
  | { type: "pick"; edition: Edition; pick: EditionPick }
  | { type: "font"; font: Font };

const props = withDefaults(
  defineProps<{
    items: MarqueeItem[];
    // Seconds one collection takes to pass a viewport-wide distance.
    speed?: number;
    direction?: "left" | "right";
    // Extra copies of the collection so the loop never shows a gap.
    duplicate?: number;
    // How far (in vw) the strip shifts while the marquee scrolls through the viewport.
    scrollSpeed?: number;
  }>(),
  { speed: 25, direction: "left", duplicate: 2, scrollSpeed: 10 },
);

const root = ref<HTMLElement | null>(null);
const status = ref<"normal" | "inverted">("normal");
let ctx: gsap.Context | null = null;

function itemKey(item: MarqueeItem) {
  return item.type === "pick"
    ? `pick-${item.pick._key}`
    : `font-${item.font._id}`;
}

onMounted(() => {
  const el = root.value;
  if (!el) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  gsap.registerPlugin(ScrollTrigger);

  ctx = gsap.context(() => {
    const collections = el.querySelectorAll<HTMLElement>(
      ".marquee__collection",
    );
    const strip = el.querySelector<HTMLElement>(".marquee__scroll");
    if (!collections.length || !strip) return;

    // -1 moves left, 1 moves right.
    const baseDirection = props.direction === "right" ? 1 : -1;
    const speedMultiplier =
      window.innerWidth < 479 ? 0.25 : window.innerWidth < 991 ? 0.5 : 1;
    const duration =
      props.speed *
      (collections[0]!.offsetWidth / window.innerWidth) *
      speedMultiplier;

    strip.style.marginLeft = `${-props.scrollSpeed}%`;
    strip.style.width = `${props.scrollSpeed * 2 + 100}%`;

    const loop = gsap
      .to(collections, { xPercent: -100, repeat: -1, duration, ease: "none" })
      // Start mid-way through the endless repeat so it can also run backwards.
      .totalProgress(0.5);
    loop.timeScale(-baseDirection);

    // Scrolling down runs the marquee in its base direction, scrolling up reverses it.
    ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        const inverted = self.direction === -1;
        loop.timeScale(inverted ? baseDirection : -baseDirection);
        status.value = inverted ? "inverted" : "normal";
      },
    });

    // Shift the whole strip while it scrolls past, which reads as a speed-up.
    const shift = baseDirection === -1 ? props.scrollSpeed : -props.scrollSpeed;
    gsap.fromTo(
      strip,
      { x: `${shift}vw` },
      {
        x: `${-shift}vw`,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: 0,
        },
      },
    );
  }, el);
});

onUnmounted(() => {
  ctx?.revert();
});
</script>

<template>
  <div
    ref="root"
    class="marquee"
    :data-marquee-direction="direction"
    :data-marquee-status="status"
  >
    <div class="marquee__scroll">
      <div
        v-for="copy in duplicate + 1"
        :key="copy"
        class="marquee__collection"
        :aria-hidden="copy > 1 ? 'true' : undefined"
        :inert="copy > 1 ? true : undefined"
      >
        <div v-for="item in items" :key="itemKey(item)" class="marquee__item">
          <NuxtLink
            v-if="item.type === 'pick'"
            :to="pickHref(item.edition, item.pick)"
            class="marquee__pick"
          >
            <PickImage
              v-if="item.pick.image?.asset?._ref"
              :asset-id="item.pick.image.asset._ref"
              :alt="item.pick.image.alt || item.pick.title"
              sizes="50vw"
            />
          </NuxtLink>
          <FontCard v-else :font="item.font" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "~~/assets/scss/2-tools" as *;

.marquee {
  overflow: hidden;
  width: 100%;
  margin-bottom: var(--space-8);

  @include maxbp(sm) {
    margin-top: var(--space-6);
    margin-bottom: var(--space-8);
  }
}

.marquee__scroll {
  display: flex;
  width: 100%;
  will-change: transform;
}

.marquee__collection {
  display: flex;
  flex: none;
  align-items: flex-start;
  gap: 1rem;
  // Keeps the 1rem gap between the last item of one copy and the first of the next.
  padding-right: 1rem;
  will-change: transform;
}

// Every item shares one height; widths follow each image's own aspect ratio.
.marquee__item {
  --marquee-item-height: clamp(16rem, 10vw, 34rem);
  flex: none;
  height: var(--marquee-item-height);

  // Phones: lower, so more than one item shows at a time.
  @include maxbp(sm) {
    --marquee-item-height: 11rem;
  }

  :deep(.font-card) {
    height: 100%;
    width: auto;
  }
}

.marquee__pick {
  display: block;
  height: 100%;

  img {
    display: block;
    height: 100%;
    width: auto;
  }
}
</style>
