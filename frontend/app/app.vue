<script setup lang="ts">
import { gsap } from "gsap";

const lenis = useLenis();
const router = useRouter();

function getDimmer() {
  return document.getElementById("page-dimmer");
}

function scrollToHash(hash: string) {
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  const target = document.getElementById(id);
  if (!target) return;

  const margin =
    Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  lenis.value?.scrollTo(target, {
    immediate: true,
    offset: margin ? 0 : -(window.innerHeight * 0.1),
  });
}

const nuxtApp = useNuxtApp();
nuxtApp.hook("page:loading:end", () => {
  const hash = router.currentRoute.value.hash;
  if (!hash) return;
  requestAnimationFrame(() => {
    scrollToHash(hash);
  });
});

router.beforeEach(() => {
  return new Promise<void>((resolve) => {
    gsap.to(getDimmer(), {
      opacity: 1,
      duration: 0.35,
      ease: "power2.inOut",
      onComplete: resolve,
    });
  });
});

router.afterEach((to) => {
  if (!to.hash) {
    lenis.value?.scrollTo(0, { immediate: true });
  }
  gsap.to(getDimmer(), {
    opacity: 0,
    duration: 0.35,
    ease: "power2.inOut",
  });
});
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
