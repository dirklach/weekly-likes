# FFDL SCSS in Weekly Likes

Date: 2026-09-04

## Goal

Use [Frontend Framework by Dirk Lach (FFDL)](https://github.com/dirklach/frontend-framework-dirk-lach) as the CSS foundation for the Nuxt frontend. Weekly Likes owns a copied copy of the SCSS; it is not linked as a package or submodule.

## Source

Copy from the local clone at `../frontend-framework-dirk-lach/src/scss` (same repo as GitHub `dirklach/frontend-framework-dirk-lach`). Do not pull demo HTML, JS, compiled CSS, or the framework’s Vite/browser-sync tooling.

## Target layout

Replace the current stub files (`frontend/assets/scss/main.scss`, `_reset.scss`, `_space.scss`) with:

```
frontend/assets/scss/
  main.scss
  1-variables/   _config.scss, _index.scss
  2-tools/       _breakpoints.scss, _index.scss
  3-generic/     _reset.scss, _global.scss, _index.scss
  4-layout/      _grid.scss, _col.scss, _subgrid.scss, _section.scss, _index.scss
  5-styles/      _text-headings.scss, _text-copy.scss, _text-additional.scss, _index.scss
  6-components/  _index.scss
  7-utilities/   _margin.scss, _index.scss
  8-themes/      _index.scss
```

`main.scss` uses the same `@use` chain as FFDL (`1-variables` through `8-themes`).

## Include / exclude

Include: variables, tools, generic, layout, text styles, margin utilities, themes, and an empty components index.

Exclude:

- `7-utilities/_demo.scss` and its `@forward` in `_index.scss`
- `6-components/_footer.scss` (sample). `6-components/_index.scss` forwards nothing until Weekly Likes components exist.

Leave `_config.scss` on FFDL defaults. Do not retune colors, fonts, or spacing in this pass.

## Nuxt wiring

Keep `css: ["~~/assets/scss/main.scss"]` in `frontend/nuxt.config.ts`. Sass is already a devDependency. No new packages.

## Out of scope

- Token / theme customization (Inter, white/black, custom space scale)
- Changing `app.vue` markup (no `data-grid` / `.col` wiring yet)
- Vue components, Sanity, or routing

`.grid` on the existing header will pick up the layout system; column placement is a later task.

## Verification

`pnpm dev` in `frontend` compiles without Sass errors. The running app uses FFDL reset/global styles (not the deleted stub). The header’s `.grid` class applies the framework grid.
