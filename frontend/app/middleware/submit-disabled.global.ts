// Keep /submit, /submit/success and /submit/cancel unreachable while submissions are parked.
export default defineNuxtRouteMiddleware((to) => {
  if (SUBMIT_ENABLED) return
  if (to.path === "/submit" || to.path.startsWith("/submit/")) {
    return abortNavigation(createError({ statusCode: 404, statusMessage: "Page not found" }))
  }
})
