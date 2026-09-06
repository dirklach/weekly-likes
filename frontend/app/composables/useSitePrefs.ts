export function useSitePrefs() {
  const hideCredits = useCookie<boolean>("wl-hide-credits", {
    default: () => false,
    sameSite: "lax",
    decode: (value) => value === "true",
    encode: (value) => String(value),
  })

  const darkMode = useCookie<boolean>("wl-dark-mode", {
    default: () => false,
    sameSite: "lax",
    decode: (value) => value === "true",
    encode: (value) => String(value),
  })

  function toggleCredits() {
    hideCredits.value = !hideCredits.value
  }

  function toggleDarkMode() {
    darkMode.value = !darkMode.value
  }

  return {
    hideCredits,
    darkMode,
    toggleCredits,
    toggleDarkMode,
  }
}
