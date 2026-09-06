<template>
  <div>
    <DemoGrid />

    <Header />

    <slot />

    <Metabar :show-credits="false" show-back />
  </div>
</template>
