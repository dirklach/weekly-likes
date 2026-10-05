const ZOOM_QUERY = "(min-width: 768px)";

export const FONT_COLUMN_OPTIONS = [2, 3, 4, 5];
const DEFAULT_FONT_COLUMNS = 4;

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

  const fontColumns = useCookie<number>("wl-font-columns", {
    default: () => DEFAULT_FONT_COLUMNS,
    sameSite: "lax",
    decode: (value) => {
      const count = Number(value);
      return FONT_COLUMN_OPTIONS.includes(count) ? count : DEFAULT_FONT_COLUMNS;
    },
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
    fontColumns,
    zoomedOut,
    canZoom,
    toggleCredits,
    toggleDarkMode,
    toggleZoom,
  };
}
