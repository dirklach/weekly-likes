<script setup lang="ts">
import PickCard from "~/components/pick-card.vue";

const PICK_COUNT = 6;
const FONT_COUNT = 6;

const { hideCredits } = useSitePrefs();
const creditsHidden = computed(() => hideCredits.value);
const [{ data: editions }, { data: fonts }] = await Promise.all([
  useEditions(),
  useFonts(),
]);

// Keys are chosen once on the server per request and reused on the client to avoid hydration
// mismatches, so every reload shows a new selection.
const randomPickKeys = useState<string[]>("random-picks", () =>
  shuffled(
    (editions.value || []).flatMap((edition) =>
      (edition.picks || []).map((pick) => `${edition._id}:${pick._key}`),
    ),
  ).slice(0, PICK_COUNT),
);

const randomFontIds = useState<string[]>("random-fonts", () =>
  shuffled((fonts.value || []).map((font) => font._id)).slice(0, FONT_COUNT),
);

const randomPicks = computed(() =>
  randomPickKeys.value.flatMap((key) => {
    const [editionId, pickKey] = key.split(":");
    const edition = editions.value?.find((e) => e._id === editionId);
    const pick = edition?.picks?.find((p) => p._key === pickKey);
    return edition && pick ? [{ edition, pick }] : [];
  }),
);

const randomFonts = computed(() =>
  randomFontIds.value.flatMap(
    (id) => fonts.value?.find((font) => font._id === id) ?? [],
  ),
);
</script>

<template>
  <section class="section">
    <div class="intro --home | grid">
      <div class="col">
        <h1 class="heading-2">
          Exploring<br />
          visual culture.
        </h1>
      </div>
    </div>
  </section>

  <section class="section edition-section">
    <div class="edition-group | grid">
      <div
        class="edition-group__title | col"
        data-grid="df:12"
        :class="{ hide: creditsHidden }"
      >
        <div class="section-title">
          <div class="section-title__heading">
            <h1>Weekly Inspiration</h1>
          </div>
          <div class="section-title__text">
            <p>
              Loorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
              nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam
              erat, sed diam voluptua at.
            </p>
          </div>
        </div>
      </div>
      <PickCard
        v-for="{ edition, pick } in randomPicks"
        :key="pick._key"
        :edition="edition"
        :pick="pick"
        data-grid="df:6 sm:4 md:4"
        loading="eager"
      />
      <div class="home-more | col" data-grid="df:12">
        <NuxtLink to="/weekly" class="text-link">View all</NuxtLink>
      </div>
    </div>
  </section>

  <section v-if="randomFonts.length" class="section home-fonts">
    <div class="grid">
      <div
        class="edition-group__title | col"
        data-grid="df:12"
        :class="{ hide: creditsHidden }"
      >
        <div class="section-title">
          <div class="section-title__heading">
            <h1>Font Inspiration</h1>
          </div>
          <div class="section-title__text">
            <p>
              Loorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
              nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam
              erat, sed diam voluptua at.
            </p>
          </div>
        </div>
      </div>
      <div class="col" data-grid="df:12">
        <div class="home-fonts__grid">
          <FontCard v-for="font in randomFonts" :key="font._id" :font="font" />
        </div>
      </div>
      <div class="home-more | col" data-grid="df:12">
        <NuxtLink to="/fonts" class="text-link">View all</NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use "~~/assets/scss/2-tools" as *;

.home-more {
  display: flex;
  justify-content: center;
  margin-top: var(--space-1);
  margin-bottom: var(--space-5);
}

.home-fonts {
  margin-top: var(--space-5);
}

.home-fonts__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--default-column-gap);

  @include bp(sm) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @include bp(md) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
