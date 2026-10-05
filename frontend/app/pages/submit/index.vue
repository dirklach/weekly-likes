<script setup lang="ts">
type Field = "workUrl" | "submitterName" | "submitterEmail" | "authorNames" | "authorWebsite";

const form = reactive({
  workUrl: "",
  submitterName: "",
  submitterEmail: "",
  authorNames: [""],
  authorWebsite: "",
});
const errors = ref<Partial<Record<Field, string>>>({});
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
  const next: Partial<Record<Field, string>> = {};
  if (!isHttpUrl(form.workUrl.trim())) next.workUrl = "Please enter a valid URL (https://…)";
  if (!form.submitterName.trim()) next.submitterName = "Please enter your name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.submitterEmail.trim())) {
    next.submitterEmail = "Please enter a valid email address";
  }
  if (!form.authorNames.some((name) => name.trim())) {
    next.authorNames = "Please name at least one author";
  }
  if (form.authorWebsite.trim() && !isHttpUrl(form.authorWebsite.trim())) {
    next.authorWebsite = "Please enter a valid URL (https://…)";
  }
  errors.value = next;
  return Object.keys(next).length === 0;
}

function addAuthor() {
  if (form.authorNames.length < 10) form.authorNames.push("");
}

function removeAuthor(index: number) {
  form.authorNames.splice(index, 1);
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
        authorNames: form.authorNames.map((name) => name.trim()).filter(Boolean),
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

useHead({ title: "Submit to Weekly Likes | Aetyc" });
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

        <fieldset class="submit-form__field">
          <legend class="newsletter-form__label">Author(s)</legend>
          <div v-for="(_, index) in form.authorNames" :key="index" class="submit-form__author">
            <span class="newsletter-form__input-wrapper">
              <input
                v-model="form.authorNames[index]"
                class="newsletter-form__input"
                type="text"
                placeholder="Studio, designer or artist"
                :aria-label="`Author ${index + 1}`"
                :disabled="state === 'loading'"
              />
            </span>
            <button
              v-if="form.authorNames.length > 1"
              class="submit-form__btn text-link"
              type="button"
              @click="removeAuthor(index)"
            >
              Remove
            </button>
          </div>
          <button
            v-if="form.authorNames.length < 10"
            class="submit-form__btn text-link"
            type="button"
            @click="addAuthor"
          >
            Add author
          </button>
          <span v-if="errors.authorNames" class="submit-form__error">{{ errors.authorNames }}</span>
        </fieldset>

        <label class="submit-form__field">
          <span class="newsletter-form__label">Author website (optional)</span>
          <span class="newsletter-form__input-wrapper">
            <input
              v-model="form.authorWebsite"
              class="newsletter-form__input"
              type="url"
              placeholder="https://"
              :disabled="state === 'loading'"
            />
          </span>
          <span v-if="errors.authorWebsite" class="submit-form__error">{{ errors.authorWebsite }}</span>
        </label>

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
}

.submit-form__author {
  display: flex;
  align-items: end;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
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

.submit-form__error {
  color: var(--color-edition);
}
</style>
