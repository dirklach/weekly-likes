export default defineNuxtConfig({
  modules: ["@nuxtjs/sanity", "lenis/nuxt"],
  css: ["lenis/dist/lenis.css", "~~/assets/scss/main.scss"],
  app: {
    pageTransition: false,
    head: {
      title: "Aetyc | Weekly Design Inspiration by Dirk Lach",
    },
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
