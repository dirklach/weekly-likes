export default defineNuxtConfig({
  modules: ["@nuxtjs/sanity", "lenis/nuxt"],
  css: ["lenis/dist/lenis.css", "~~/assets/scss/main.scss"],
  app: {
    pageTransition: false,
    head: {
      title: "Aetyc | Weekly Design Inspiration by Dirk Lach",
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
