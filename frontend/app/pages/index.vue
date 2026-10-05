<script setup lang="ts">
import PickCard from "~/components/pick-card.vue"

const PICK_COUNT = 6;
const FONT_COUNT = 6;

const { hideCredits } = useSitePrefs();
const creditsHidden = computed(() => hideCredits.value);
const [{ data: editions }, { data: fonts }] = await Promise.all([useEditions(), useFonts()]);

function shuffled<T>(items: T[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

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
  randomFontIds.value.flatMap((id) => fonts.value?.find((font) => font._id === id) ?? []),
);
</script>

<template>
  <section class="section edition-section">
    <div class="edition-group | grid">
      <div
        class="edition-group__title | col"
        data-grid="df:12"
        :class="{ hide: creditsHidden }"
      >
        <div class="edition-group__title-inner">
          <h1>Discover Weekly Likes</h1>
        </div>
      </div>
      <PickCard
        v-for="{ edition, pick } in randomPicks"
        :key="pick._key"
        :edition="edition"
        :pick="pick"
        data-grid="df:12 sm:4 md:4"
        loading="eager"
      />
      <div class="home-more | col" data-grid="df:12">
        <NuxtLink to="/weekly" class="button">View all</NuxtLink>
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
        <div class="edition-group__title-inner">
          <h2>Discover Fonts</h2>
        </div>
      </div>
      <div class="col" data-grid="df:12">
        <div class="home-fonts__grid">
          <FontCard v-for="font in randomFonts" :key="font._id" :font="font" />
        </div>
      </div>
      <div class="home-more | col" data-grid="df:12">
        <NuxtLink to="/fonts" class="button">View all</NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use "~~/assets/scss/2-tools" as *;

.home-more {
  display: flex;
  justify-content: center;
  margin-top: var(--space-2);
}

.home-fonts {
  margin-top: var(--space-5);
}

.home-fonts__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-2);

  @include bp(sm) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @include bp(md) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
