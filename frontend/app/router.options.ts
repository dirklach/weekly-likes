import type { RouterConfig } from "@nuxt/schema";
import { START_LOCATION } from "vue-router";

function hashScrollPosition(hash: string) {
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  const el = document.getElementById(id);
  const cssOffset = el
    ? Number.parseFloat(getComputedStyle(el).scrollMarginTop) || 0
    : 0;
  const top = cssOffset || window.innerHeight * 0.1;

  return {
    el: el ?? hash,
    top,
    behavior: "instant" as const,
  };
}

export default {
  scrollBehavior(to, from, savedPosition) {
    const nuxtApp = useNuxtApp();
    const router = useRouter();

    if (to.path.replace(/\/$/, "") === from.path.replace(/\/$/, "")) {
      if (from.hash && !to.hash) return savedPosition ?? { left: 0, top: 0 };
      if (to.hash) return hashScrollPosition(to.hash);
      return false;
    }

    if (from === START_LOCATION) {
      if (savedPosition) return savedPosition;
      if (to.hash) return hashScrollPosition(to.hash);
      return { left: 0, top: 0 };
    }

    return new Promise((resolve) => {
      nuxtApp.hooks.hookOnce("page:loading:end", () => {
        requestAnimationFrame(() => {
          if (router.currentRoute.value.fullPath !== to.fullPath) {
            resolve(false);
            return;
          }
          if (savedPosition) {
            resolve(savedPosition);
            return;
          }
          if (to.hash) {
            resolve(hashScrollPosition(to.hash));
            return;
          }
          resolve({ left: 0, top: 0 });
        });
      });
    });
  },
} satisfies RouterConfig;
