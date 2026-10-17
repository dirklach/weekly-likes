export default defineNuxtConfig({
  modules: ["@nuxtjs/sanity", "lenis/nuxt"],
  css: ["lenis/dist/lenis.css", "~~/assets/scss/main.scss"],
  app: {
    pageTransition: false,
    head: {
      title: "Aetyc • Exploring visual culture",
      script: [
        // Umami analytics
        {
          src: "https://cloud.umami.is/script.js",
          defer: true,
          "data-website-id": "a761e967-1f38-4a42-a56e-8de0a826dcc6",
        },
      ],
    },
  },
  routeRules: {
    // "Weekly" was renamed to "Gallery"; keep old links and bookmarks working.
    "/weekly": { redirect: { to: "/gallery", statusCode: 301 } },
    "/weekly/**": { redirect: { to: "/gallery/**", statusCode: 301 } },
  },
  runtimeConfig: {
    // Server-only secrets, set via NUXT_LEMONSQUEEZY_API_KEY etc.
    lemonsqueezyApiKey: "",
    lemonsqueezyStoreId: "",
    lemonsqueezyVariantId: "",
    lemonsqueezyWebhookSecret: "",
    sanityWriteToken: "",
    public: {
      siteUrl: "",
    },
  },
  sanity: {
    projectId: "bl19dtug",
    dataset: "production",
    apiVersion: "2024-03-25",
    useCdn: true,
    perspective: "published",
    queryEndpoint: "/api/sanity.query",
  },
});
