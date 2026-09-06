<script setup lang="ts">
const route = useRoute()
const {data: editions} = await useEditions()

const edition = computed(
  () => editions.value?.find((item) => item.number === String(route.params.edition)) ?? null,
)

if (!edition.value) {
  throw createError({statusCode: 404, statusMessage: "Edition not found"})
}

const pick = computed(
  () => edition.value?.picks?.find((item) => item._key === String(route.params.key)) ?? null,
)

if (!pick.value) {
  throw createError({statusCode: 404, statusMessage: "Pick not found"})
}

const pickIndex = computed(() => {
  const index = edition.value?.picks?.findIndex((item) => item._key === String(route.params.key)) ?? -1
  return index >= 0 ? String(index + 1).padStart(2, "0") : "00"
})
</script>

<template>
  <section class="section">
    <div class="grid">
      <div class="pick__main | col" data-grid="df:12 md:6">
        <div class="pick-title">
          {{ pick.title }}
        </div>
        <div class="pick-meta">
          <div class="pick-week">
            <div class="pick-key-value">
              <div class="pick-key">Week</div>
              <div class="pick-value">{{ edition.number }}/{{ pickIndex }}</div>
            </div>
          </div>
          <div class="pick-author">
            <div class="pick-key-value">
              <div class="pick-key">By</div>
              <div class="pick-value">
                <template v-for="author in pick.authors || []" :key="author._id">
                  <a
                    v-if="author.url"
                    class="text-link"
                    :href="author.url"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {{ author.name }}
                  </a>
                  <span v-else>{{ author.name }}</span>
                </template>
              </div>
            </div>
          </div>
          <div class="pick-week">
            <div class="pick-key-value">
              <div class="pick-key">Category</div>
              <div class="pick-value">{{ pick.category?.name }}</div>
            </div>
          </div>
          <div class="pick-week">
            <div class="pick-key-value">
              <div class="pick-key">Source</div>
              <div class="pick-value">
                <a
                  v-if="pick.url"
                  class="text-link"
                  :href="pick.url"
                  target="_blank"
                  rel="noreferrer"
                >
                  Visit
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="pick__image | col" data-grid="df:12 md:6">
        <div class="pick-image__inner">
          <SanityImage
            v-if="pick.image?.asset?._ref"
            :asset-id="pick.image.asset._ref"
            :alt="pick.image.alt || pick.title"
          />
        </div>
      </div>
    </div>
  </section>
</template>
