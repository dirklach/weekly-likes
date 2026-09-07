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
</script>

<template>
  <img
    :src="src"
    :srcset="srcset"
    :sizes="sizes"
    :alt="alt"
    :width="parsed?.width"
    :height="parsed?.height"
    :loading="loading"
    decoding="async"
    :fetchpriority="loading === 'eager' ? 'high' : undefined"
  />
</template>
