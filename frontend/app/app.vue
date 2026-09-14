<script setup lang="ts">
import { gsap } from "gsap";

const lenis = useLenis();
const router = useRouter();

function getDimmer() {
  return document.getElementById("page-dimmer");
}

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

router.afterEach(() => {
  lenis.value?.scrollTo(0, { immediate: true });
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
