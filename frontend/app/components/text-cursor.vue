<script setup lang="ts">
import { gsap } from "gsap";

// A text bubble that follows the mouse over anything marked [data-cursor-hover]; the text
// comes from that element's data-cursor-text. Mice only, touch devices never see it.
const cursor = ref<HTMLElement | null>(null);
const text = ref<HTMLElement | null>(null);
const route = useRoute();

let update: (() => void) | null = null;
let cleanup: (() => void) | null = null;

onMounted(() => {
  const el = cursor.value;
  if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches)
    return;

  let mouseX = 0;
  let mouseY = 0;
  let hasMouseMoved = false;

  const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
  const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });

  update = () => {
    if (!hasMouseMoved) return;
    const hoverItem = document
      .elementFromPoint(mouseX, mouseY)
      ?.closest("[data-cursor-hover]");
    // From the mouse rather than the bubble's current (still easing) position, so it's
    // right even when the mouse has just stopped.
    const isEdge = mouseX + el.offsetWidth >= window.innerWidth;

    el.setAttribute(
      "data-cursor",
      hoverItem ? (isEdge ? "active-edge" : "active") : "",
    );

    const label = hoverItem?.getAttribute("data-cursor-text");
    if (label && text.value) text.value.textContent = label;
  };
  const scheduleUpdate = () => requestAnimationFrame(() => update?.());

  const onMouseMove = (event: MouseEvent) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    hasMouseMoved = true;
    xTo(mouseX);
    yTo(mouseY);
    scheduleUpdate();
  };

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  // The hovered element's text can change in place (e.g. "Copied" after a click).
  const observer = new MutationObserver(scheduleUpdate);
  observer.observe(document.body, {
    subtree: true,
    attributeFilter: ["data-cursor-text"],
  });

  cleanup = () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("scroll", scheduleUpdate);
    observer.disconnect();
  };
});

// The page under the mouse changes without the mouse moving.
watch(
  () => route.fullPath,
  () => nextTick(() => requestAnimationFrame(() => update?.())),
);

onUnmounted(() => cleanup?.());
</script>

<template>
  <div ref="cursor" data-cursor="" class="cursor" aria-hidden="true">
    <div class="cursor-bubble">
      <span ref="text" data-cursor-text-target="" class="cursor-bubble__text">
        Cursor Text
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.cursor {
  z-index: 25;
  pointer-events: none;
  padding-top: 1em;
  padding-left: 0.5em;
  padding-right: 1em;
  position: fixed;
  top: 0;
  left: 0;
}

.cursor-bubble {
  opacity: 0;
  color: #000;
  background-color: #fff;
  border-radius: 50em;
  justify-content: center;
  align-items: center;
  height: 3.625em;
  padding-left: 2em;
  padding-right: 2em;
  display: flex;
  position: relative;
}

.cursor-bubble__text {
  letter-spacing: -0.02em;
  white-space: nowrap;
  font-size: 1em;
  font-weight: 500;
}

@media (hover: hover) and (pointer: fine) {
  [data-cursor] .cursor-bubble {
    transition:
      transform 0.4s cubic-bezier(0.625, 0.05, 0, 1),
      opacity 0.4s cubic-bezier(0.625, 0.05, 0, 1);
    transform: translateX(0%) scale(0.9) rotate(0.001deg);
  }

  [data-cursor="active"] .cursor-bubble {
    opacity: 1;
    transform: translateX(0%) scale(1) rotate(0.001deg);
  }

  [data-cursor="active-edge"] .cursor-bubble {
    opacity: 1;
    transform: translateX(-100%) scale(1) rotate(0.001deg);
  }
}

// Fade only, no scale.
@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: reduce) {
  [data-cursor] .cursor-bubble {
    transform: translateX(0%) scale(1);
  }

  [data-cursor="active-edge"] .cursor-bubble {
    transform: translateX(-100%) scale(1);
  }
}

@media (hover: none) and (pointer: coarse) {
  .cursor {
    display: none;
  }
}
</style>
