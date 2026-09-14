<template>
  <div>
    <DemoGrid />

    <Header />

    <main class="page">
      <slot />
    </main>

    <Metabar :show-credits="true" :show-back="false" />
  </div>
</template>
