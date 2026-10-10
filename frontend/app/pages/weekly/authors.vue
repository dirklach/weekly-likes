<script setup lang="ts">
import {AUTHORS_QUERY} from "~/queries/authors"
import type {Author} from "~/types/content"

const { data } = await useSanityQuery<Author[]>(AUTHORS_QUERY, undefined, {
  key: "authors",
});

// Merge authors that share a name, keeping a website if any copy has one.
const authors = computed(() => {
  const byName = new Map<string, Author>();
  for (const author of data.value || []) {
    if (!author.name || author.name === "Unknown") continue;
    const existing = byName.get(author.name);
    if (!existing || (!existing.url && author.url)) byName.set(author.name, author);
  }
  return [...byName.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
  );
});

usePageSeo({
  title: "Authors – Weekly Likes | Aetyc",
  description:
    "The studios, designers, architects, and artists behind every pick in Weekly Likes.",
});
</script>

<template>
  <div class="intro | grid">
    <div class="col">
      <h1 class="heading-2">
        The studios, designers, architects, and artists behind every pick in
        Weekly Likes.
      </h1>
    </div>
  </div>
  <section class="section">
    <div class="grid">
      <ul class="author-list | col" data-grid="df:12">
        <li v-for="author in authors" :key="author._id" class="author-list__item">
          <a
            v-if="author.url"
            :href="author.url"
            class="text-link"
            target="_blank"
            rel="noopener"
          >
            {{ author.name }}
          </a>
          <span v-else>{{ author.name }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use "~~/assets/scss/2-tools" as *;

.author-list {
  list-style: none;
  margin: 0;
  padding: 0;
  columns: 1;
  font-size: 1.5rem;
  line-height: 1.15;

  @include bp(sm) {
    font-size: 2rem;
  }

  @include bp(sm) {
    columns: 2;
  }

  @include bp(md) {
    columns: 3;
  }
}

.author-list__item {
  break-inside: avoid;
  padding-bottom: 0.25em;
}
</style>
