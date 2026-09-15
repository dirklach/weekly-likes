<script setup lang="ts">
const email = ref("");
const state = ref<"idle" | "loading" | "success" | "error">("idle");
const errorMessage = ref("");

async function submit() {
  if (state.value === "loading") return;
  state.value = "loading";
  errorMessage.value = "";

  try {
    await $fetch("/api/subscribe", {
      method: "POST",
      body: { email: email.value },
    });
    state.value = "success";
    email.value = "";
  } catch (err: any) {
    state.value = "error";
    errorMessage.value =
      err?.data?.message || "Something went wrong. Please try again.";
  }
}
</script>

<template>
  <form
    v-if="state !== 'success'"
    class="newsletter-form"
    @submit.prevent="submit"
  >
    <div class="newsletter-form__row">
      <div class="newsletter-form__label">Newsletter</div>
      <div class="newsletter-form__input-wrapper">
        <input
          v-model="email"
          class="newsletter-form__input"
          type="email"
          placeholder="Your Email Address"
          required
          :disabled="state === 'loading'"
          autocomplete="email"
        />
      </div>
      <button
        class="newsletter-form__btn text-link"
        type="submit"
        :disabled="state === 'loading'"
      >
        {{ state === "loading" ? "Subscribing…" : "Subscribe" }}
      </button>
    </div>
    <p v-if="state === 'error'" class="newsletter-form__error">
      {{ errorMessage }}
    </p>
  </form>

  <p v-else class="newsletter-form__success">
    You're in — check your inbox to confirm.
  </p>
</template>
