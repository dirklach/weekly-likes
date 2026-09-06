export default defineNuxtPlugin((nuxtApp) => {
  function toggleDemoGrid() {
    const demoGrid = document.querySelector(".demo-grid");
    if (demoGrid) {
      demoGrid.classList.toggle("--show");
    }
  }

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "g") {
      toggleDemoGrid();
    }
  });

  nuxtApp.hook("app:mounted", () => {
    const toggleButton = document.querySelector(".demo-grid-toggle");
    if (toggleButton) {
      toggleButton.addEventListener("click", () => {
        toggleDemoGrid();
      });
    }
  });
});
