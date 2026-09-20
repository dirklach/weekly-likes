const ZOOM_QUERY = "(min-width: 768px)";

let zoomViewportBound = false;

function bindZoomViewport(canZoom: Ref<boolean>) {
  if (zoomViewportBound || typeof window === "undefined") return;
  zoomViewportBound = true;

  const mq = window.matchMedia(ZOOM_QUERY);
  const sync = () => {
    canZoom.value = mq.matches;
  };
  sync();
  mq.addEventListener("change", sync);
}

function isZoomViewport() {
  return typeof window !== "undefined" && window.matchMedia(ZOOM_QUERY).matches;
}

export function useSitePrefs() {
  const hideCredits = useCookie<boolean>("wl-hide-credits", {
    default: () => false,
    sameSite: "lax",
    decode: (value) => value === "true",
    encode: (value) => String(value),
  });

  const darkMode = useCookie<boolean>("wl-dark-mode", {
    default: () => false,
    sameSite: "lax",
    decode: (value) => value === "true",
    encode: (value) => String(value),
  });

  const zoomedOut = useState("wl-zoomed-out", () => false);
  const canZoom = useState("wl-can-zoom", () => false);

  onMounted(() => {
    bindZoomViewport(canZoom);
  });

  function toggleCredits() {
    hideCredits.value = !hideCredits.value;
  }

  function toggleDarkMode() {
    darkMode.value = !darkMode.value;
  }

  function toggleZoom() {
    if (!isZoomViewport()) return;
    zoomedOut.value = !zoomedOut.value;
  }

  return {
    hideCredits,
    darkMode,
    zoomedOut,
    canZoom,
    toggleCredits,
    toggleDarkMode,
    toggleZoom,
  };
}
