<script setup lang="ts">
const WIDTHS = [480, 768, 1024, 1280, 1600]

const props = withDefaults(
  defineProps<{
    assetId: string
    alt?: string
    sizes: string
    loading?: "lazy" | "eager"
  }>(),
  {
    alt: "",
    loading: "lazy",
  },
)

const sanity = useSanity()
const parsed = computed(() => parseAssetId(props.assetId))

const srcset = computed(() => {
  const maxWidth = parsed.value?.width ?? WIDTHS[WIDTHS.length - 1]
  return WIDTHS.filter((width) => width <= maxWidth)
    .map((width) => {
      const url = sanityImageUrl(
        props.assetId,
        sanity.config.projectId,
        sanity.config.dataset || "production",
        width,
      )
      return `${url} ${width}w`
    })
    .join(", ")
})

const src = computed(() =>
  sanityImageUrl(
    props.assetId,
    sanity.config.projectId,
    sanity.config.dataset || "production",
    800,
  ),
)

const el = ref<HTMLImageElement | null>(null)
const active = ref(props.loading === "eager")

onMounted(() => {
  if (active.value) return

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      active.value = true
      observer.disconnect()
    },
    {rootMargin: "600px 0px"},
  )

  if (el.value) observer.observe(el.value)
  onUnmounted(() => observer.disconnect())
})

</script>

<template>
  <img
    ref="el"
    :src="active ? src : undefined"
    :srcset="active ? srcset : undefined"
    :sizes="sizes"
    :alt="alt"
    :width="parsed?.width"
    :height="parsed?.height"
    :loading="loading"
    decoding="async"
    :fetchpriority="loading === 'eager' ? 'high' : undefined"
  />
</template>
