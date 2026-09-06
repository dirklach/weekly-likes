<script setup lang="ts">
const header = ref<HTMLElement | null>(null)

onMounted(() => {
  const el = header.value
  if (!el) return

  const setHeight = () => {
    document.documentElement.style.setProperty(
      "--header-height",
      `${el.offsetHeight}px`,
    )
  }

  setHeight()
  const observer = new ResizeObserver(setHeight)
  observer.observe(el)

  onUnmounted(() => {
    observer.disconnect()
    document.documentElement.style.removeProperty("--header-height")
  })
})
</script>

<template>
  <section ref="header" class="header-section | section">
    <div class="header | grid">
      <div class="header__logo | col" data-grid="sm:6 md:3 lg:4">
        <NuxtLink to="/">Weekly Likes</NuxtLink>
      </div>
      <div class="header__desc | col" data-grid="df:12 sm:6 md:4 lg:3">
        Featuring selected work in Design, Art, Photography, and Architecture.
      </div>
      <div class="col" data-grid="lg:1"></div>
      <div class="header__meta | col" data-grid="df:12 sm:6 md:2">Selected by Dirk Lach</div>
      <div class="header__cta | col" data-grid="df:12 sm:6 md:2 lg:2">
        <a href="#" class="text-link">Subscribe Newsletter</a>
      </div>
    </div>
  </section>
</template>
