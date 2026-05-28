# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workspace overview

This repo is a pnpm workspace with two main packages:

- `packages/streamdown` — the published Vue 3 markdown renderer library (`@brucekit/streamdown-vue`)
- `apps/playground` — a local Vite playground wired to the package source via aliasing for manual verification

Root scripts mostly proxy into those two workspaces.

## Common commands

Run all commands from the repository root unless a package-local path is shown.

### Install

```bash
pnpm install
```

### Library development

```bash
pnpm build
pnpm test
pnpm test:ui
pnpm test:coverage
pnpm bench
pnpm bench:ui
pnpm size
```

### Run a single test file

```bash
pnpm --filter @brucekit/streamdown-vue exec vitest run __tests__/utils.test.ts
```

### Playground development

```bash
pnpm playground
pnpm playground:build
pnpm playground:preview
```

## Build and packaging notes

- The library build is driven by `packages/streamdown/tsup.config.ts` and outputs ESM plus declarations into `packages/streamdown/dist`.
- `packages/streamdown/scripts/postbuild.js` prepends `"use client"` to built JS files in `dist`. Preserve that behavior when changing the build pipeline.
- The playground Vite config aliases `@brucekit/streamdown-vue` and `@brucekit/streamdown-vue/styles.css` directly to `packages/streamdown/index.ts` and `packages/streamdown/styles.css`, so playground changes exercise local source rather than a published build.
- The GitHub Pages workflow builds the playground with `pnpm playground:build` and deploys `apps/playground/dist`.

## Testing notes

- The library uses Vitest with `jsdom`; config lives at `packages/streamdown/vitest.config.ts`.
- Tests are concentrated in `packages/streamdown/__tests__` and cover rendering behavior, streaming edge cases, controls, plugins, sanitization, and memoization-sensitive component behavior.
- Benchmarks live under `packages/streamdown/__benchmarks__` and use `vitest bench`.

## High-level architecture

### Main rendering flow

The public entry point is `packages/streamdown/index.ts`, which exports the `Streamdown` component and most public types/helpers.

There are two rendering modes:

- `static`: parse the full markdown string in one pass
- `streaming`: split the content into blocks and render incrementally while handling incomplete markdown safely

At a high level, `Streamdown` does this:

1. Accepts markdown from the `children` prop or default slot.
2. Optionally repairs in-progress markdown with `remend` when `mode="streaming"` and `parseIncompleteMarkdown` is enabled.
3. Optionally preprocesses literal tags and custom allowed tags before parsing.
4. In streaming mode, splits markdown into renderable blocks with `parseMarkdownIntoBlocks`.
5. Merges default/user/plugin remark + rehype plugins.
6. Renders either the whole document (`static`) or one `Block` per parsed chunk (`streaming`).
7. Provides runtime context for controls, themes, link safety, mermaid config, icons, translations, plugins, and class prefixing.

### Markdown pipeline

`packages/streamdown/lib/markdown.ts` contains the markdown-to-VNode pipeline.

- Uses `unified` with `remark-parse` -> `remark-rehype` -> rehype plugins.
- Uses a small LRU cache of processors keyed by plugin configuration to avoid rebuilding the unified pipeline on repeated renders.
- Converts HAST to Vue VNodes with a custom renderer instead of JSX runtime helpers.
- Applies optional filtering/transforms after parsing, including URL transformation, allowed/disallowed elements, unwrap behavior, and `skipHtml` handling.
- If `rehypeRaw` is not present, `remarkEscapeHtml` is added so raw HTML is treated safely as text.

### Default parsing and sanitization

Default plugin setup is defined in `packages/streamdown/index.ts`.

- Default remark plugins: GFM + custom code metadata parsing
- Default rehype plugins: raw HTML parsing, sanitize, then `rehype-harden`
- The sanitize schema is extended to allow `tel:` links and `metastring` on `code` nodes
- `allowedTags` extends the sanitize schema only when using the default rehype plugin stack; if a caller supplies custom `rehypePlugins`, they take responsibility for that behavior

### Streaming-specific behavior

The streaming behavior is not just a normal markdown render loop.

- `packages/streamdown/lib/parse-blocks.ts` uses `marked` tokenization to split markdown into blocks that are safe to render incrementally.
- The splitter deliberately keeps some constructs together, including footnotes, multi-block HTML, and unmatched `$$` math regions.
- `Block` provides per-block incomplete state so downstream code blocks know when a fence is still open.
- Caret rendering is suppressed for incomplete code fences and tables.
- Optional animation is implemented as a rehype plugin created by `createAnimatePlugin`, so animation hooks into rendered output rather than a separate DOM post-process.

### Component layer

`packages/streamdown/lib/components.ts` defines the default tag-to-component mapping used by the markdown renderer.

Important responsibilities there:

- Replace raw markdown tags with styled Vue components.
- Route fenced code blocks into one of three paths:
  - custom renderer from `plugins.renderers`
  - Mermaid renderer when language is `mermaid`
  - default code block renderer for everything else
- Respect control settings for tables, code blocks, and Mermaid blocks.
- Implement link-safety interception for external links.
- Handle structural special cases like image-only paragraphs, block-code paragraphs, and empty footnote sections.

### Plugin model

Plugin contracts are defined in `packages/streamdown/lib/plugin-types.ts`.

The library recognizes four plugin categories plus custom renderers:

- `code` — Shiki-style syntax highlighter API
- `mermaid` — diagram renderer API
- `math` — remark + rehype plugins for math parsing/rendering
- `cjk` — remark plugins that run before and/or after GFM
- `renderers` — custom Vue components for specific fenced-code languages

Plugin access is provided through Vue injection in `packages/streamdown/lib/plugin-context.ts`.

When changing plugin behavior, preserve ordering semantics:

- CJK `remarkPluginsBefore`
- default/user remark plugins
- CJK `remarkPluginsAfter`
- math remark plugin
- rehype plugins plus optional literal-tag, math, and animation additions

### Context system

Several runtime settings are provided through Vue injection instead of prop-drilling:

- `lib/streamdown-context.ts` — controls, animation state, line numbers, link safety, Mermaid config, mode, Shiki theme
- `lib/plugin-context.ts` — configured plugins and custom renderers
- `lib/icon-context.ts` — icon overrides
- `lib/translations-context.ts` — UI text overrides
- `lib/prefix-context.ts` — class prefixing via `prefix`
- `lib/block-incomplete-context.ts` and `lib/code-block/context.ts` — block-local render state

If you change internal UI subcomponents, check whether the value should come from context rather than a new prop.

### Styling model

- The package ships a single `packages/streamdown/styles.css` stylesheet.
- Internal class composition uses `clsx` + `tailwind-merge` helpers from `lib/utils.ts`.
- The `prefix` prop rewrites utility classes for Tailwind v4 `prefix()` compatibility, so avoid bypassing `createCn` / `useCn` in new styled components.

### Playground role

The playground at `apps/playground/src/App.vue` is the best manual integration surface for this repo.

It exercises:

- static vs streaming mode
- animation and caret settings
- built-in controls
- link safety
- dark/light Mermaid config
- bundled plugins (`code`, `cjk`, `math`, `mermaid`)
- a custom fenced-code renderer (`vega-lite`)

For UI-facing changes to rendering behavior, validate them in the playground in addition to running tests.
