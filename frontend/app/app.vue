<script setup lang="ts">
import { gsap } from "gsap";

const lenis = useLenis();
const router = useRouter();
const route = useRoute();

// Site-wide defaults; pages override them through usePageSeo.
const canonicalUrl = computed(() => absoluteUrl(route.path));
useSeoMeta({
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  ogTitle: SITE_TITLE,
  ogDescription: SITE_DESCRIPTION,
  ogImage: DEFAULT_OG_IMAGE,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogUrl: canonicalUrl,
  ogType: "website",
  ogSiteName: SITE_NAME,
  twitterCard: "summary_large_image",
  twitterTitle: SITE_TITLE,
  twitterDescription: SITE_DESCRIPTION,
  twitterImage: DEFAULT_OG_IMAGE,
});
// Hides the page until the intro timeline (plugins/intro.client.ts) takes over.
const introPending = useState("intro-pending", () => true);
useHead({
  htmlAttrs: {
    lang: "en",
    "data-intro": computed(() => (introPending.value ? "true" : "false")),
  },
  link: [{ rel: "canonical", href: canonicalUrl }],
  noscript: [
    {
      innerHTML:
        "<style>html[data-intro='true'] .header-section .col, html[data-intro='true'] .page > *, html[data-intro='true'] .footer-section, html[data-intro='true'] .metabar { opacity: 1 !important; }</style>",
    },
  ],
});

function getDimmer() {
  return document.getElementById("page-dimmer");
}

function scrollToHash(hash: string) {
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  const target = document.getElementById(id);
  if (!target) return;

  const margin =
    Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  // Lenis still has the previous (shorter) page's height cached; without a fresh measure it
  // clamps this scroll near the top, and the next wheel event jumps there.
  lenis.value?.resize();
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
