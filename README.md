# @brucekit/streamdown-vue

A Vue 3 markdown renderer built for AI-style streaming output.

`@brucekit/streamdown-vue` renders normal markdown well, but its main focus is incomplete, incrementally updated markdown such as chat responses from LLMs. It supports streaming-aware rendering, code highlighting, Mermaid, math, CJK improvements, custom fenced-code renderers, and configurable controls.

## Acknowledgements

This project was built with heavy inspiration from [streamdown.ai](https://streamdown.ai/). The overall idea, product direction, and many interaction patterns were learned from and inspired by their work.

## Features

- Vue 3 component API
- Streaming and static rendering modes
- Handles incomplete markdown during generation
- GitHub Flavored Markdown support
- Optional animation and caret effects
- Optional code, Mermaid, math, and CJK plugins
- Line numbers, copy/download/fullscreen controls
- Custom fenced-code renderers
- Link safety hooks and modal override support

## Installation

```bash
pnpm add @brucekit/streamdown-vue
```

If you use optional plugins, install them separately:

```bash
pnpm add @streamdown/code @streamdown/mermaid @streamdown/math @streamdown/cjk katex
```

Import the built-in styles once in your app entry:

```ts
import "@brucekit/streamdown-vue/styles.css";
```

If you use the math plugin, also import KaTeX styles:

```ts
import "katex/dist/katex.css";
```

## Basic usage

```vue
<script setup lang="ts">
import { Streamdown } from "@brucekit/streamdown-vue";
import "@brucekit/streamdown-vue/styles.css";

const markdown = `# Hello\n\nThis is **Streamdown**.`;
</script>

<template>
  <Streamdown :children="markdown" mode="static" />
</template>
```

## Streaming usage

For chat or incremental output, keep `children` updated and drive `isAnimating` from your streaming state.

```vue
<script setup lang="ts">
import { ref } from "vue";
import { Streamdown } from "@brucekit/streamdown-vue";

const markdown = ref("");
const isStreaming = ref(true);
</script>

<template>
  <Streamdown
    :children="markdown"
    :is-animating="isStreaming"
    animated
    caret="block"
    mode="streaming"
  />
</template>
```

## With plugins

```vue
<script setup lang="ts">
import { ref } from "vue";
import { Streamdown } from "@brucekit/streamdown-vue";
import { code } from "@streamdown/code";
import { mermaid } from "@streamdown/mermaid";
import { math } from "@streamdown/math";
import { cjk } from "@streamdown/cjk";
import "@brucekit/streamdown-vue/styles.css";
import "katex/dist/katex.css";

const markdown = ref(`## Demo

\`\`\`ts
const answer = 42;
\`\`\`

\$\$E = mc^2\$\$

\`\`\`mermaid
graph TD
  A[Start] --> B[Done]
\`\`\`
`);

const plugins = {
  code,
  mermaid,
  math,
  cjk,
};
</script>

<template>
  <Streamdown :children="markdown" :plugins="plugins" mode="static" />
</template>
```

## Basic configuration

### `mode`

Controls how markdown is processed.

- `"streaming"` — optimized for incremental content
- `"static"` — render as a complete markdown document

```vue
<Streamdown :children="markdown" mode="streaming" />
```

### `isAnimating`

Marks whether new content is still arriving. This affects streaming-specific behavior such as incomplete code fences, controls, and caret rendering.

```vue
<Streamdown :children="markdown" :is-animating="isStreaming" mode="streaming" />
```

### `animated`

Enables entry animation.

- `true` uses the default animation
- an object gives you full control

```vue
<Streamdown
  :children="markdown"
  :animated="{
    animation: 'blurIn',
    duration: 240,
    easing: 'ease-out',
    sep: 'char',
  }"
/>
```

Available fields:

- `animation`: `"fadeIn" | "blurIn" | "slideUp"`
- `duration`: number in ms
- `easing`: CSS easing string
- `sep`: `"word" | "char"`

### `caret`

Adds a streaming caret to the last block while animating.

```vue
<Streamdown :children="markdown" :is-animating="isStreaming" caret="block" />
```

Supported values:

- `"block"`
- `"circle"`

### `lineNumbers`

Turns code block line numbers on or off.

```vue
<Streamdown :children="markdown" :line-numbers="false" />
```

### `controls`

Configures built-in controls for tables, code blocks, and Mermaid blocks.

```vue
<Streamdown
  :children="markdown"
  :controls="{
    code: { copy: true, download: true },
    table: { copy: true, download: true, fullscreen: true },
    mermaid: { copy: true, download: true, fullscreen: true, panZoom: true },
  }"
/>
```

You can also pass `true` or `false` to enable or disable all controls.

### `linkSafety`

Lets you intercept external links.

```vue
<Streamdown
  :children="markdown"
  :link-safety="{
    enabled: true,
    onLinkCheck: (url) => url.startsWith('https://'),
  }"
/>
```

Fields:

- `enabled`: enable link checking
- `onLinkCheck`: custom allow/block function
- `renderModal`: custom confirmation modal renderer

### `mermaid`

Pass Mermaid configuration or a custom error component.

```vue
<Streamdown
  :children="markdown"
  :mermaid="{
    config: { theme: 'dark' },
  }"
/>
```

### `shikiTheme`

Set light and dark themes for the code plugin.

```vue
<Streamdown
  :children="markdown"
  :plugins="plugins"
  :shiki-theme="['github-light', 'github-dark']"
/>
```

### `dir`

Text direction control.

- `"auto"`
- `"ltr"`
- `"rtl"`

```vue
<Streamdown :children="markdown" dir="auto" />
```

### `prefix`

Prefixes internal class names with your own namespace.

```vue
<Streamdown :children="markdown" prefix="chat" />
```

### `parseIncompleteMarkdown`

When `true`, Streamdown will try to repair incomplete markdown while streaming.

```vue
<Streamdown :children="markdown" mode="streaming" :parse-incomplete-markdown="true" />
```

### `normalizeHtmlIndentation`

Useful when rendering embedded HTML blocks whose indentation should be normalized before parsing.

```vue
<Streamdown :children="markdown" :normalize-html-indentation="true" />
```

## Custom fenced-code renderers

You can replace the default code block for specific languages with your own Vue component.

```vue
<script setup lang="ts">
import { Streamdown, type CustomRendererProps } from "@brucekit/streamdown-vue";
import { h } from "vue";

const JsonPreview = (props: CustomRendererProps) =>
  h("pre", { style: "padding: 12px;" }, props.code);

const plugins = {
  renderers: [
    {
      language: ["json-preview", "json-demo"],
      component: JsonPreview,
    },
  ],
};
</script>

<template>
  <Streamdown :children="markdown" :plugins="plugins" />
</template>
```

`CustomRendererProps` contains:

- `code: string`
- `language: string`
- `isIncomplete: boolean`
- `meta?: string`

You can also reuse exported helpers such as `CodeBlockContainer` and `CodeBlockHeader` to keep the built-in code block layout.

## Styling

The package ships with its own stylesheet:

```ts
import "@brucekit/streamdown-vue/styles.css";
```

If you need to override visuals, start by targeting Streamdown's rendered structure in your app stylesheet. The playground in this repo is a good reference for practical overrides.

## Development

From the workspace root:

```bash
pnpm install
pnpm test
pnpm playground
```

Useful commands:

```bash
pnpm build
pnpm test
pnpm playground
pnpm playground:build
```

## Repository

- package source: `packages/streamdown`
- playground: `apps/playground`

## License

Apache-2.0
