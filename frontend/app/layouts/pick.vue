<template>
  <div class="pick-detail">
    <Header />
    <slot />
  </div>
</template>

<style lang="scss">
.pick-overlay {
  position: fixed;
  inset: 0;
  z-index: 30;
  overflow-y: auto;
  background: var(--color-secondary);
  will-change: transform;
}
</style>
