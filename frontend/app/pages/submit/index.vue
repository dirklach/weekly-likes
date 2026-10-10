<script setup lang="ts">
const MAX_AUTHORS = 10;
const emptyAuthor = () => ({ name: "", website: "" });

const form = reactive({
  workUrl: "",
  submitterName: "",
  submitterEmail: "",
  authors: [emptyAuthor()],
});
// Keys: workUrl, submitterName, submitterEmail, authors, authors.<index>.website
const errors = ref<Record<string, string>>({});
const state = ref<"idle" | "loading" | "error">("idle");
const errorMessage = ref("");

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

function validate() {
  const next: Record<string, string> = {};
  if (!isHttpUrl(form.workUrl.trim())) next.workUrl = "Please enter a valid URL (https://…)";
  if (!form.submitterName.trim()) next.submitterName = "Please enter your name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.submitterEmail.trim())) {
    next.submitterEmail = "Please enter a valid email address";
  }
  if (!form.authors.some((author) => author.name.trim())) {
    next.authors = "Please name at least one author";
  }
  form.authors.forEach((author, index) => {
    const website = author.website.trim();
    if (website && !isHttpUrl(website)) {
      next[`authors.${index}.website`] = "Please enter a valid URL (https://…)";
    }
  });
  errors.value = next;
  return Object.keys(next).length === 0;
}

function addAuthor() {
  if (form.authors.length < MAX_AUTHORS) form.authors.push(emptyAuthor());
}

function removeAuthor(index: number) {
  form.authors.splice(index, 1);
  errors.value = {};
}

async function submit() {
  if (state.value === "loading" || !validate()) return;
  state.value = "loading";
  errorMessage.value = "";

  try {
    const { url } = await $fetch<{ url: string | null }>("/api/submit", {
      method: "POST",
      body: {
        ...form,
        authors: form.authors
          .map((author) => ({ name: author.name.trim(), website: author.website.trim() }))
          .filter((author) => author.name),
      },
    });
    if (!url) throw new Error("Missing checkout URL");
    window.location.href = url;
  } catch (err: any) {
    state.value = "error";
    errors.value = err?.data?.data?.errors || {};
    errorMessage.value = err?.data?.message || "Something went wrong. Please try again.";
  }
}

usePageSeo({
  title: "Submit to Weekly Likes | Aetyc",
  description:
    "Submit your work in design, art, architecture, or photography for Weekly Likes. Every submission is reviewed personally.",
});
</script>

<template>
  <div class="intro | grid">
    <div class="col" data-grid="md:12">
      <h1 class="heading-2">
        Submit your work for Weekly Likes. Every submission is reviewed
        personally; a reviewing fee of 10 EUR applies.
      </h1>
    </div>
  </div>
  <section class="section">
    <div class="grid">
      <form class="submit-form | col" data-grid="df:12 md:6" novalidate @submit.prevent="submit">
        <label class="submit-form__field">
          <span class="newsletter-form__label">Link to the work</span>
          <span class="newsletter-form__input-wrapper">
            <input
              v-model="form.workUrl"
              class="newsletter-form__input"
              type="url"
              placeholder="https://"
              required
              :disabled="state === 'loading'"
            />
          </span>
          <span v-if="errors.workUrl" class="submit-form__error">{{ errors.workUrl }}</span>
        </label>

        <fieldset
          v-for="(author, index) in form.authors"
          :key="index"
          class="submit-form__group"
        >
          <legend class="newsletter-form__label">
            {{ form.authors.length > 1 ? `Author ${index + 1}` : "Author" }}
          </legend>
          <label class="submit-form__field">
            <span class="newsletter-form__label">Name</span>
            <span class="newsletter-form__input-wrapper">
              <input
                v-model="author.name"
                class="newsletter-form__input"
                type="text"
                placeholder="Studio, designer or artist"
                :disabled="state === 'loading'"
              />
            </span>
          </label>
          <label class="submit-form__field">
            <span class="newsletter-form__label">Website (optional)</span>
            <span class="newsletter-form__input-wrapper">
              <input
                v-model="author.website"
                class="newsletter-form__input"
                type="url"
                placeholder="https://"
                :disabled="state === 'loading'"
              />
            </span>
            <span v-if="errors[`authors.${index}.website`]" class="submit-form__error">
              {{ errors[`authors.${index}.website`] }}
            </span>
          </label>
          <button
            v-if="form.authors.length > 1"
            class="submit-form__btn text-link"
            type="button"
            :disabled="state === 'loading'"
            @click="removeAuthor(index)"
          >
            Remove author
          </button>
        </fieldset>
        <div class="submit-form__field">
          <button
            v-if="form.authors.length < MAX_AUTHORS"
            class="submit-form__btn text-link"
            type="button"
            :disabled="state === 'loading'"
            @click="addAuthor"
          >
            Add another author
          </button>
          <span v-if="errors.authors" class="submit-form__error">{{ errors.authors }}</span>
        </div>

        <label class="submit-form__field">
          <span class="newsletter-form__label">Your name</span>
          <span class="newsletter-form__input-wrapper">
            <input
              v-model="form.submitterName"
              class="newsletter-form__input"
              type="text"
              autocomplete="name"
              required
              :disabled="state === 'loading'"
            />
          </span>
          <span v-if="errors.submitterName" class="submit-form__error">{{ errors.submitterName }}</span>
        </label>

        <label class="submit-form__field">
          <span class="newsletter-form__label">Your email address</span>
          <span class="newsletter-form__input-wrapper">
            <input
              v-model="form.submitterEmail"
              class="newsletter-form__input"
              type="email"
              autocomplete="email"
              required
              :disabled="state === 'loading'"
            />
          </span>
          <span v-if="errors.submitterEmail" class="submit-form__error">{{ errors.submitterEmail }}</span>
        </label>

        <button class="submit-form__submit text-link" type="submit" :disabled="state === 'loading'">
          {{ state === "loading" ? "Redirecting to payment…" : "Continue to payment (10 EUR)" }}
        </button>
        <p class="submit-form__note">
          The 10 EUR is a review fee: payment doesn't guarantee publication, and
          it can't be refunded once your work has been reviewed. Payment is
          handled by Lemon Squeezy, see
          <NuxtLink to="/privacy" class="text-link">Privacy</NuxtLink>.
        </p>
        <p v-if="state === 'error'" class="submit-form__error">{{ errorMessage }}</p>
      </form>
    </div>
  </section>
</template>

<style scoped lang="scss">
.submit-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.submit-form__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;
}

.submit-form__field .newsletter-form__input {
  width: 100%;
  color: var(--color-primary);
  font: inherit;
}

.submit-form__group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;
}

.submit-form__group .submit-form__btn {
  align-self: start;
}

.submit-form__btn,
.submit-form__submit {
  background: transparent;
  border: 0;
  margin: 0;
  padding: 0;
  color: var(--color-primary);
  font: inherit;
  cursor: pointer;
}

.submit-form__submit:disabled {
  cursor: default;
  opacity: 0.5;
}

// Pulled up towards the pay button it belongs to.
.submit-form__note {
  margin-top: calc(var(--space-2) - var(--space-4));
  max-width: 32em;
  color: var(--color-edition);
  line-height: 1.35;

  .text-link {
    color: var(--color-primary);
  }
}

.submit-form__error {
  color: var(--color-edition);
}
</style>
