<script setup lang="ts">
const { hideCredits } = useSitePrefs();
const creditsHidden = computed(() => hideCredits.value);
const { data: editions } = await useEditions();

// Pick keys are chosen once on the server and reused on the client to avoid hydration mismatches.
const randomKeys = useState<string[]>("random-picks", () => {
  const keys = (editions.value || []).flatMap((edition) =>
    (edition.picks || []).map((pick) => `${edition._id}:${pick._key}`),
  );
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [keys[i], keys[j]] = [keys[j]!, keys[i]!];
  }
  return keys.slice(0, 3);
});

const randomPicks = computed(() =>
  randomKeys.value.flatMap((key) => {
    const [editionId, pickKey] = key.split(":");
    const edition = editions.value?.find((e) => e._id === editionId);
    const pick = edition?.picks?.find((p) => p._key === pickKey);
    return edition && pick ? [{ edition, pick }] : [];
  }),
);
</script>

<template>
  <div class="intro intro--home | grid">
    <div class="col">
      <div class="intro intro--home">
        <h1>A discovery platform visual culture.</h1>
      </div>
    </div>
  </div>
  <section class="section edition-section">
    <div class="edition-group | grid">
      <div
        class="edition-group__title | col"
        data-grid="df:12"
        :class="{ hide: creditsHidden }"
      >
        <div class="edition-group__title-inner">
          <h1>• Weekly Likes</h1>
          <h2>
            Every week, we add three picks from design, art, and architecture to
            our archive of inspiration, and sometimes something more unexpected.
            Here are three random picks.
          </h2>
        </div>
      </div>
      <NuxtLink
        v-for="{ edition, pick } in randomPicks"
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
            loading="eager"
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
</template>
