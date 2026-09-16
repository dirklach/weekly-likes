<script setup lang="ts">
const { hideCredits, zoomedOut } = useSitePrefs();
const creditsHidden = computed(() => hideCredits.value || zoomedOut.value);
const { data: editions } = await useEditions();
</script>

<template>
  <div class="intro | grid">
    <div class="col">
      <h1 class="heading-2">
        A weekly updated catalog of selected works across design, architecture,
        photography, and art. Subscribe to receive updates straight to your
        inbox. Three beautiful picks per week.
      </h1>
    </div>
  </div>
  <div :class="{ 'is-zoomed-out': zoomedOut }">
    <p v-if="!editions?.length" class="section grid">
      <span class="col" data-grid="df:12">No editions yet.</span>
    </p>

    <section
      v-for="(edition, editionIndex) in editions || []"
      :key="edition._id"
      class="section edition-section"
      :class="{ 'edition-section--zoomed-out': zoomedOut }"
    >
      <div class="edition-group | grid" :id="edition.number">
        <div
          class="edition-group__title | col"
          data-grid="df:12"
          :class="{ hide: creditsHidden }"
        >
          <div class="edition-group__title-inner">
            Week {{ edition.number }}
          </div>
        </div>
        <NuxtLink
          v-for="pick in edition.picks || []"
          :key="pick._key"
          :to="pickHref(edition, pick)"
          class="edition | col"
          data-grid="df:12 sm:4 md:4"
        >
          <div class="edition-image-container">
            <PickImage
              v-if="pick.image?.asset?._ref"
              :asset-id="pick.image.asset._ref"
              :alt="pick.image.alt || pick.title"
              class="edition-image"
              sizes="(min-width: 768px) 33vw, 100vw"
              :loading="editionIndex === 0 ? 'eager' : 'lazy'"
            />
          </div>
          <div class="edition-text" :class="{ hide: creditsHidden }">
            <div class="edition-text__inner">
              <span class="edition-name">{{ pick.title }}</span>
              <span class="edition-author">{{ authorNames(pick) }}</span>
              <span class="edition-category">{{ pick.category?.name }}</span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
