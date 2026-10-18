// Open state of the search overlay, shared by the header, the mobile menu and the overlay.
export function useSearch() {
  const searchOpen = useState("search-open", () => false)

  function openSearch() {
    searchOpen.value = true
  }

  function closeSearch() {
    searchOpen.value = false
  }

  return { searchOpen, openSearch, closeSearch }
}
