<template>
  <div class="app-shell">
    <header class="topbar">
      <div>
        <h1>Streamdown Vue Playground</h1>
        <p class="subtitle">
          Try Streamdown against local source with markdown, streaming, plugins, and controls.
        </p>
      </div>
    </header>

    <section class="toolbar panel">
      <div class="toolbar-controls">
        <label>
          <span>Sample</span>
          <select v-model="selectedSample">
            <option v-for="sample in samples" :key="sample.id" :value="sample.id">
              {{ sample.label }}
            </option>
          </select>
        </label>

        <label>
          <span>Mode</span>
          <select v-model="mode">
            <option value="streaming">streaming</option>
            <option value="static">static</option>
          </select>
        </label>

        <label>
          <span>Controls</span>
          <select v-model="controlsMode">
            <option value="on">on</option>
            <option value="off">off</option>
          </select>
        </label>

        <label>
          <span>Link safety</span>
          <select v-model="linkSafetyMode">
            <option value="on">on</option>
            <option value="off">off</option>
          </select>
        </label>

        <details class="settings-menu">
          <summary class="ghost">Display settings</summary>
          <div class="settings-panel">
            <label>
              <span>Caret</span>
              <select v-model="caret">
                <option value="">none</option>
                <option value="block">block</option>
                <option value="circle">circle</option>
              </select>
            </label>

            <label>
              <span>Animated</span>
              <select v-model="animatedMode">
                <option value="off">off</option>
                <option value="on">on</option>
              </select>
            </label>

            <template v-if="animatedMode === 'on'">
              <label>
                <span>Effect</span>
                <select v-model="animationEffect">
                  <option value="fadeIn">Fade in</option>
                  <option value="blurIn">Blur in</option>
                  <option value="slideUp">Slide up</option>
                </select>
              </label>

              <label>
                <span>Duration (ms)</span>
                <input v-model.number="animationDuration" min="0" step="10" type="number" />
              </label>

              <label>
                <span>Easing</span>
                <select v-model="animationEasing">
                  <option value="ease">ease</option>
                  <option value="ease-in">ease-in</option>
                  <option value="ease-out">ease-out</option>
                  <option value="ease-in-out">ease-in-out</option>
                  <option value="linear">linear</option>
                </select>
              </label>

              <label>
                <span>Split by</span>
                <select v-model="animationSplitBy">
                  <option value="word">Word</option>
                  <option value="char">Character</option>
                </select>
              </label>
            </template>

            <label>
              <span>Line numbers</span>
              <select v-model="lineNumbersMode">
                <option value="on">on</option>
                <option value="off">off</option>
              </select>
            </label>

            <label>
              <span>Speed (ms)</span>
              <input v-model.number="streamingSpeed" min="10" step="10" type="number" />
            </label>
          </div>
        </details>

        <label class="switch">
          <input v-model="darkMode" type="checkbox" />
          <span>Dark mode</span>
        </label>
      </div>

      <div class="toolbar-actions">
        <button v-if="!isAnimating" type="button" class="ghost primary" @click="runStreaming">
          Simulate streaming
        </button>
        <button v-else type="button" class="ghost danger" @click="stopStreaming">
          Stop streaming
        </button>
      </div>
    </section>

    <main class="layout">
      <section class="panel editor-panel">
        <div class="section-heading">
          <h2>Markdown</h2>
        </div>

        <label class="textarea-field">
          <textarea ref="editorRef" v-model="sourceMarkdown" spellcheck="false" />
        </label>
      </section>

      <section class="panel preview-panel">
        <div class="section-heading">
          <h2>Preview</h2>
          <p class="status">{{ statusLabel }}</p>
        </div>

        <div ref="previewRef" class="preview-frame">
          <Streamdown :animated="animatedValue" :caret="caretValue" :children="renderedMarkdown"
            :class-name="'playground-streamdown'" :controls="controlsValue" :is-animating="isAnimating"
            :link-safety="linkSafetyValue" :line-numbers="lineNumbersValue" :mermaid="mermaidValue" :mode="mode"
            :plugins="plugins" />
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Streamdown } from "@brucekit/streamdown-vue";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import VegaLiteRenderer from "./components/VegaLiteRenderer.vue";

type Sample = {
  id: string;
  label: string;
  markdown: string;
};

const defaultMarkdown = `# Streamdown Feature Showcase

This playground demonstrates every feature supported by Streamdown.

---

## Text Formatting

Regular paragraph text with **bold**, *italic*, ***bold italic***, and ~~strikethrough~~ formatting. You can also use \`inline code\` within text.

---

## Headings

# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

---

## Links and Images

Visit [Streamdown on GitHub](https://github.com/haydenbleasel/streamdown) or paste a raw URL like https://streamdown.dev and it becomes a link automatically.

![Streamdown logo](https://streamdown.dev/og.png)

---

## Blockquotes

> This is a blockquote. It supports **formatting** and *emphasis* inside.
>
> > Blockquotes can also be nested.

---

## Lists

### Unordered Lists

- First item
- Second item
  - Nested item
    - Deeply nested item
- Third item

### Ordered Lists

1. First step
2. Second step
   1. Sub-step A
   2. Sub-step B
3. Third step

### Task Lists

- [x] Completed task
- [X] Also completed
- [ ] Pending task
  - [x] Nested completed task
  - [ ] Nested pending task

---

## Tables

| Feature | Status | Notes |
|:--------|:------:|------:|
| Markdown | Supported | CommonMark compliant |
| GFM | Supported | Tables, tasks, strikethrough |
| Code highlighting | Supported | 200+ languages via Shiki |
| Math | Supported | KaTeX rendering |
| Mermaid | Supported | Flowcharts, sequences, and more |
| CJK | Supported | Chinese, Japanese, Korean |

---

## Code

Inline \`code\` renders within text. Block code gets syntax highlighting:

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

async function fetchUser(id: string): Promise<User> {
  const response = await fetch(\`/api/users/\${id}\`);

  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }

  return response.json();
}
\`\`\`

\`\`\`python
def fibonacci(n: int) -> list[int]:
    """Generate the first n Fibonacci numbers."""
    sequence = [0, 1]
    for _ in range(2, n):
        sequence.append(sequence[-1] + sequence[-2])
    return sequence[:n]

print(fibonacci(10))
\`\`\`

\`\`\`css
:root {
  --primary: #0070f3;
  --background: #ffffff;
}

.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
}
\`\`\`

\`\`\`bash
# Install Streamdown
npm install streamdown @streamdown/code @streamdown/math @streamdown/mermaid
\`\`\`

---

## Mathematics

Inline math: $$E = mc^2$$ and $$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$.

Block math for display equations:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} \\, dx = \\sqrt{\\pi}
$$

$$
\\begin{bmatrix}
a & b \\\\
c & d
\\end{bmatrix}
\\begin{bmatrix}
x \\\\
y
\\end{bmatrix}
=
\\begin{bmatrix}
ax + by \\\\
cx + dy
\\end{bmatrix}
$$

$$
f(x) = \\begin{cases}
x^2 & \\text{if } x \\geq 0 \\\\
-x^2 & \\text{if } x < 0
\\end{cases}
$$

---

## Mermaid Diagrams

### Flowchart

\`\`\`mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[Ship it]
\`\`\`

### Sequence Diagram

\`\`\`mermaid
sequenceDiagram
    participant Client
    participant Server
    participant Database

    Client->>Server: POST /api/data
    Server->>Database: INSERT query
    Database-->>Server: Success
    Server-->>Client: 201 Created
\`\`\`

### State Diagram

\`\`\`mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Loading: fetch()
    Loading --> Success: 200 OK
    Loading --> Error: 4xx/5xx
    Error --> Loading: retry()
    Success --> Idle: reset()
\`\`\`

---

## Vega-Lite Charts (Custom Renderer)

\`\`\`vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "description": "A bar chart showing monthly revenue.",
  "width": "container",
  "height": 200,
  "data": {
    "values": [
      {"month": "Jan", "revenue": 28},
      {"month": "Feb", "revenue": 55},
      {"month": "Mar", "revenue": 43},
      {"month": "Apr", "revenue": 91},
      {"month": "May", "revenue": 81},
      {"month": "Jun", "revenue": 53}
    ]
  },
  "mark": {"type": "bar", "cornerRadiusTopLeft": 4, "cornerRadiusTopRight": 4},
  "encoding": {
    "x": {"field": "month", "type": "nominal", "axis": {"labelAngle": 0}},
    "y": {"field": "revenue", "type": "quantitative", "title": "Revenue ($k)"},
    "color": {"field": "month", "type": "nominal", "legend": null, "scale": {"scheme": "tableau10"}}
  }
}
\`\`\`

---

## CJK Support

**Chinese:** **你好世界。** Streamdown 支持中文排版。

**Japanese:** *こんにちは。* Streamdown は日本語をサポートしています。

**Korean:** ~~안녕하세요.~~ Streamdown은 한국어를 지원합니다.

---

## Horizontal Rules

Three dashes create a horizontal rule:

---

## HTML Entities

&copy; 2025 &mdash; Streamdown &bull; Built with &hearts;
`;

const samples: Sample[] = [
  {
    id: "basic",
    label: "Basic markdown",
    markdown: defaultMarkdown,
  },
  {
    id: "streaming",
    label: "Streaming sample",
    markdown: `# Streaming sample\n\nThis sentence starts incomplete and then finishes with **bold text** and a table.\n\n| Name | Value |\n| --- | --- |\n| Alpha | 1 |\n| Beta | 2 |`,
  },
  {
    id: "code",
    label: "Code block",
    markdown: "```ts\nconst greet = (name: string) => `Hello, ${name}`;\nconsole.log(greet('Streamdown'));\n```",
  },
  {
    id: "table",
    label: "Table controls",
    markdown: `| Feature | Status |\n| --- | --- |\n| Copy | Ready |\n| Download | Ready |\n| Fullscreen | Ready |`,
  },
  {
    id: "mermaid",
    label: "Mermaid diagram",
    markdown: "```mermaid\ngraph TD;\n  A[Stream] --> B[Markdown]\n  B --> C[Vue]\n```",
  },
  {
    id: "math",
    label: "Math sample",
    markdown: `Euler's identity: $e^{i\\pi} + 1 = 0$\n\n$$\\int_0^1 x^2 \\, dx = \\frac{1}{3}$$`,
  },
  {
    id: "cjk",
    label: "CJK sample",
    markdown: `**これは太字です（bold）**\n\n- 中文项目【带括号】\n- 한국어 항목（괄호）`,
  },
  {
    id: "vega-lite",
    label: "Vega-Lite chart",
    markdown: `\`\`\`vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "description": "A simple bar chart.",
  "width": "container",
  "height": 200,
  "data": {
    "values": [
      {"category": "A", "amount": 28},
      {"category": "B", "amount": 55},
      {"category": "C", "amount": 43},
      {"category": "D", "amount": 91}
    ]
  },
  "mark": {"type": "bar", "cornerRadiusTopLeft": 4, "cornerRadiusTopRight": 4},
  "encoding": {
    "x": {"field": "category", "type": "nominal", "axis": {"labelAngle": 0}},
    "y": {"field": "amount", "type": "quantitative"},
    "color": {"field": "category", "type": "nominal", "legend": null}
  }
}
\`\`\``,
  },
  {
    id: "mixed",
    label: "Mixed stress test",
    markdown: [
      "# Mixed stress test",
      "",
      "**Streaming** markdown with CJK: 这是一个例子。",
      "",
      "```js",
      "const url = 'https://example.com';",
      "```",
      "",
      "> Blockquote with `inline code` and math $a^2 + b^2 = c^2$.",
      "",
      "![Alt text](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80)",
    ].join("\n"),
  },
];

const selectedSample = ref(samples[0].id);
const sourceMarkdown = ref(samples[0].markdown);
const renderedMarkdown = ref(samples[0].markdown);
const mode = ref<"static" | "streaming">("streaming");
const darkMode = ref(false);
const caret = ref<"" | "block" | "circle">("block");
const animatedMode = ref<"off" | "on">("on");
const animationEffect = ref<"fadeIn" | "blurIn" | "slideUp">("blurIn");
const animationDuration = ref(150);
const animationEasing = ref("ease");
const animationSplitBy = ref<"word" | "char">("word");
const lineNumbersMode = ref<"on" | "off">("on");
const controlsMode = ref<"on" | "off">("on");
const linkSafetyMode = ref<"on" | "off">("on");
const isAnimating = ref(false);
const streamingTimer = ref<number | null>(null);
const streamingSource = ref<string | null>(null);
const streamingSpeed = ref(30);
const editorRef = ref<HTMLTextAreaElement | null>(null);
const previewRef = ref<HTMLDivElement | null>(null);

const currentSample = computed(() =>
  samples.find((sample) => sample.id === selectedSample.value) ?? samples[0]
);

const plugins = {
  code,
  cjk,
  math,
  mermaid,
  renderers: [{ language: ["vega-lite", "vegalite"], component: VegaLiteRenderer }],
};

const animatedValue = computed(() => {
  if (animatedMode.value === "off") {
    return false;
  }

  return {
    animation: animationEffect.value,
    duration: Math.max(0, Number(animationDuration.value) || 0),
    easing: animationEasing.value,
    sep: animationSplitBy.value,
  };
});

const caretValue = computed(() => (caret.value ? caret.value : undefined));
const lineNumbersValue = computed(() => lineNumbersMode.value === "on");
const controlsValue = computed(() => controlsMode.value === "on");
const linkSafetyValue = computed(() => ({ enabled: linkSafetyMode.value === "on" }));
const mermaidValue = computed(() => ({ config: { theme: darkMode.value ? "dark" : "default" } }));

const statusLabel = computed(() => {
  if (isAnimating.value) {
    return "Streaming preview";
  }
  return mode.value === "streaming" ? "Ready to stream" : "Static preview";
});

const clearStreamingTimer = () => {
  if (streamingTimer.value !== null) {
    window.clearInterval(streamingTimer.value);
    streamingTimer.value = null;
  }
};

const stopStreaming = () => {
  const full = streamingSource.value ?? sourceMarkdown.value;
  clearStreamingTimer();
  isAnimating.value = false;
  streamingSource.value = null;
  sourceMarkdown.value = full;
  renderedMarkdown.value = full;
};

const syncStreamingScroll = async () => {
  await nextTick();

  if (editorRef.value) {
    editorRef.value.scrollTop = editorRef.value.scrollHeight;
  }

  if (previewRef.value) {
    previewRef.value.scrollTop = previewRef.value.scrollHeight;
  }
};

const runStreaming = () => {
  stopStreaming();

  const full = sourceMarkdown.value;
  streamingSource.value = full;
  isAnimating.value = true;
  sourceMarkdown.value = "";
  renderedMarkdown.value = "";
  const interval = Math.max(10, Number(streamingSpeed.value) || 30);
  let index = 0;
  streamingTimer.value = window.setInterval(() => {
    index += 1;
    const next = full.slice(0, index);
    sourceMarkdown.value = next;
    renderedMarkdown.value = next;
    syncStreamingScroll();
    if (index >= full.length) {
      stopStreaming();
      syncStreamingScroll();
    }
  }, interval);
};

watch(selectedSample, () => {
  const next = currentSample.value.markdown;
  sourceMarkdown.value = next;
  renderedMarkdown.value = next;
  stopStreaming();
});

watch(darkMode, (value) => {
  document.documentElement.classList.toggle("dark", value);
}, { immediate: true });

watch(sourceMarkdown, () => {
  if (!isAnimating.value) {
    renderedMarkdown.value = sourceMarkdown.value;
  }
});

onMounted(() => {
  renderedMarkdown.value = sourceMarkdown.value;
});

onBeforeUnmount(() => {
  clearStreamingTimer();
});
</script>
