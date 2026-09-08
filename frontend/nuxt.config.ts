export default defineNuxtConfig({
  modules: ["@nuxtjs/sanity", "lenis/nuxt"],
  css: ["lenis/dist/lenis.css", "~~/assets/scss/main.scss"],
  app: {
    pageTransition: { name: "page", mode: "out-in" },
    layoutTransition: false,
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
