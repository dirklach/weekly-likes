<script setup lang="ts">
import {gsap} from 'gsap'

// ── State ─────────────────────────────────────────────────────────────────────
const isOpen = ref(false)
const email = ref('')
const state = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const errorMessage = ref('')

// ── Refs ──────────────────────────────────────────────────────────────────────
const overlay = ref<HTMLElement | null>(null)
const drawer = ref<HTMLElement | null>(null)

// ── GSAP Timelines ────────────────────────────────────────────────────────────
let tlOpen: gsap.core.Timeline | null = null
let tlClose: gsap.core.Timeline | null = null

function buildTimelines() {
  // Kill any existing timelines
  tlOpen?.kill()
  tlClose?.kill()

  // ── Open timeline ──────────────────────────────────────────────────────────
  tlOpen = gsap.timeline({
    paused: true,
    onStart() {
      if (overlay.value) overlay.value.style.display = 'block'
    },
  })

  tlOpen
    // Backdrop fades in
    .fromTo(
      overlay.value,
      {opacity: 0},
      {opacity: 1, duration: 0.45, ease: 'power2.out'},
      0,
    )
    // Drawer slides in from the right
    .fromTo(
      drawer.value,
      {xPercent: 100},
      {xPercent: 0, duration: 0.55, ease: 'expo.out'},
      0.05, // slight delay after backdrop starts
    )
  // 👉 Add more open animations here (e.g. stagger content elements)

  // ── Close timeline ─────────────────────────────────────────────────────────
  tlClose = gsap.timeline({
    paused: true,
    onComplete() {
      if (overlay.value) overlay.value.style.display = 'none'
      isOpen.value = false
    },
  })

  tlClose
    // Drawer slides out to the right
    .to(drawer.value, {xPercent: 100, duration: 0.45, ease: 'expo.in'}, 0)
    // Backdrop fades out
    .to(overlay.value, {opacity: 0, duration: 0.35, ease: 'power2.in'}, 0.1)
  // 👉 Add more close animations here
}

// ── Open / Close ──────────────────────────────────────────────────────────────
function open() {
  if (isOpen.value) return
  isOpen.value = true
  tlClose?.pause(0)
  tlOpen?.restart()
}

function close() {
  if (!isOpen.value) return
  tlOpen?.pause()
  tlClose?.restart()
}

// Escape key closes the drawer
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

// ── Subscribe ─────────────────────────────────────────────────────────────────
async function submit() {
  if (state.value === 'loading') return
  state.value = 'loading'
  errorMessage.value = ''

  try {
    await $fetch('/api/subscribe', {
      method: 'POST',
      body: {email: email.value},
    })
    state.value = 'success'
    email.value = ''
  } catch (err: any) {
    state.value = 'error'
    errorMessage.value = err?.data?.message || 'Something went wrong. Please try again.'
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  // Set initial drawer position off-screen without a visible flash
  gsap.set(drawer.value, {xPercent: 100})
  gsap.set(overlay.value, {opacity: 0, display: 'none'})

  buildTimelines()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  tlOpen?.kill()
  tlClose?.kill()
  window.removeEventListener('keydown', onKeydown)
})

// ── Expose open() so parent (header) can call it ──────────────────────────────
defineExpose({open})
</script>

<template>
  <!-- Backdrop -->
  <div ref="overlay" class="nl-overlay" aria-hidden="true" @click="close" />

  <!-- Drawer -->
  <aside ref="drawer" class="nl-drawer" role="dialog" aria-modal="true" aria-label="Newsletter">
    <div class="nl-drawer__inner">
      <!-- Close -->
      <button class="nl-drawer__close text-link" type="button" @click="close">Close</button>

      <!-- Content -->
      <div class="nl-drawer__content">
        <p class="nl-drawer__label">Newsletter</p>
        <p class="nl-drawer__desc">
          Every week, three things that inspired me. Subscribe and get Weekly Likes straight to your
          inbox.
        </p>

        <!-- Form -->
        <form v-if="state !== 'success'" class="nl-form" @submit.prevent="submit">
          <input
            v-model="email"
            class="nl-form__input"
            type="email"
            placeholder="Your email"
            required
            :disabled="state === 'loading'"
            autocomplete="email"
          />
          <button class="nl-form__btn" type="submit" :disabled="state === 'loading'">
            {{ state === 'loading' ? 'Subscribing…' : 'Subscribe' }}
          </button>
          <p v-if="state === 'error'" class="nl-form__error">{{ errorMessage }}</p>
        </form>

        <p v-else class="nl-form__success">You're in — check your inbox to confirm.</p>
      </div>
    </div>
  </aside>
</template>

<style lang="scss">
// ── Backdrop ──────────────────────────────────────────────────────────────────
.nl-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.7);
  cursor: pointer;
}

// ── Drawer ────────────────────────────────────────────────────────────────────
.nl-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  width: min(25vw, 100vw); // 25vw desktop, full-width on small screens
  background: #000;
  color: #fff;
  will-change: transform;

  @media (max-width: 1024px) {
    width: min(50vw, 100vw);
  }

  @media (max-width: 768px) {
    width: 100vw;
  }
}

.nl-drawer__inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--space-2);
}

.nl-drawer__close {
  align-self: flex-end;
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font: inherit;

  // override text-link underline color for dark bg
  &::before,
  &::after {
    background: #fff;
  }
}

.nl-drawer__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: auto;
  margin-bottom: auto;
}

.nl-drawer__label {
  font-size: var(--size-3);
  line-height: var(--line-height-2);
}

.nl-drawer__desc {
  opacity: 0.6;
  line-height: var(--line-height-4);
}

// ── Form ──────────────────────────────────────────────────────────────────────
.nl-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.nl-form__input {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  font: inherit;
  padding: var(--space-1) 0;
  outline: none;
  transition: border-color 0.3s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  &:focus {
    border-bottom-color: #fff;
  }
}

.nl-form__btn {
  align-self: flex-start;
  margin-top: var(--space-1);
  background: #fff;
  color: #000;
  border: none;
  font: inherit;
  padding: var(--space-1) var(--space-2);
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.nl-form__error {
  color: #ff6b6b;
  font-size: var(--size--1);
}

.nl-form__success {
  opacity: 0.8;
  line-height: var(--line-height-4);
}
</style>
