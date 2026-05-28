<template>
  <div class="app-shell">
    <header class="topbar">
      <div>
        <h1>{{ t.title }}</h1>
        <p class="subtitle">
          {{ t.subtitle }}
        </p>
      </div>
    </header>

    <section class="toolbar panel">
      <div class="toolbar-controls">
        <label>
          <span>{{ t.labels.sample }}</span>
          <select v-model="selectedSample">
            <option v-for="sample in samples" :key="sample.id" :value="sample.id">
              {{ sample.label }}
            </option>
          </select>
        </label>

        <label>
          <span>{{ t.labels.mode }}</span>
          <select v-model="mode">
            <option value="streaming">{{ t.options.streaming }}</option>
            <option value="static">{{ t.options.static }}</option>
          </select>
        </label>

        <label>
          <span>{{ t.labels.controls }}</span>
          <select v-model="controlsMode">
            <option value="on">{{ t.options.on }}</option>
            <option value="off">{{ t.options.off }}</option>
          </select>
        </label>

        <label>
          <span>{{ t.labels.linkSafety }}</span>
          <select v-model="linkSafetyMode">
            <option value="on">{{ t.options.on }}</option>
            <option value="off">{{ t.options.off }}</option>
          </select>
        </label>

        <label>
          <span>{{ t.labels.language }}</span>
          <select v-model="locale">
            <option value="en">{{ t.languages.en }}</option>
            <option value="zh-CN">{{ t.languages["zh-CN"] }}</option>
          </select>
        </label>

        <details class="settings-menu">
          <summary class="ghost">{{ t.labels.displaySettings }}</summary>
          <div class="settings-panel">
            <label>
              <span>{{ t.labels.caret }}</span>
              <select v-model="caret">
                <option value="">{{ t.options.none }}</option>
                <option value="block">{{ t.options.caretBlock }}</option>
                <option value="circle">{{ t.options.caretCircle }}</option>
              </select>
            </label>

            <label>
              <span>{{ t.labels.animated }}</span>
              <select v-model="animatedMode">
                <option value="off">{{ t.options.off }}</option>
                <option value="on">{{ t.options.on }}</option>
              </select>
            </label>

            <template v-if="animatedMode === 'on'">
              <label>
                <span>{{ t.labels.effect }}</span>
                <select v-model="animationEffect">
                  <option value="fadeIn">{{ t.options.fadeIn }}</option>
                  <option value="blurIn">{{ t.options.blurIn }}</option>
                  <option value="slideUp">{{ t.options.slideUp }}</option>
                </select>
              </label>

              <label>
                <span>{{ t.labels.duration }}</span>
                <input v-model.number="animationDuration" min="0" step="10" type="number" />
              </label>

              <label>
                <span>{{ t.labels.easing }}</span>
                <select v-model="animationEasing">
                  <option value="ease">ease</option>
                  <option value="ease-in">ease-in</option>
                  <option value="ease-out">ease-out</option>
                  <option value="ease-in-out">ease-in-out</option>
                  <option value="linear">linear</option>
                </select>
              </label>

              <label>
                <span>{{ t.labels.splitBy }}</span>
                <select v-model="animationSplitBy">
                  <option value="word">{{ t.options.word }}</option>
                  <option value="char">{{ t.options.char }}</option>
                </select>
              </label>
            </template>

            <label>
              <span>{{ t.labels.lineNumbers }}</span>
              <select v-model="lineNumbersMode">
                <option value="on">{{ t.options.on }}</option>
                <option value="off">{{ t.options.off }}</option>
              </select>
            </label>

            <label>
              <span>{{ t.labels.speed }}</span>
              <input v-model.number="streamingSpeed" min="10" step="10" type="number" />
            </label>
          </div>
        </details>

        <label class="switch">
          <input v-model="darkMode" type="checkbox" />
          <span>{{ t.labels.darkMode }}</span>
        </label>
      </div>

      <div class="toolbar-actions">
        <button v-if="!isAnimating" type="button" class="ghost primary" @click="runStreaming">
          {{ t.actions.simulateStreaming }}
        </button>
        <button v-else type="button" class="ghost danger" @click="stopStreaming">
          {{ t.actions.stopStreaming }}
        </button>
      </div>
    </section>

    <main class="layout">
      <section class="panel editor-panel">
        <div class="section-heading">
          <h2>{{ t.sections.markdown }}</h2>
        </div>

        <label class="textarea-field">
          <textarea ref="editorRef" v-model="sourceMarkdown" spellcheck="false" />
        </label>
      </section>

      <section class="panel preview-panel">
        <div class="section-heading">
          <h2>{{ t.sections.preview }}</h2>
          <p class="status">{{ statusLabel }}</p>
        </div>

        <div ref="previewRef" class="preview-frame">
          <Streamdown
            :animated="animatedValue"
            :caret="caretValue"
            :children="renderedMarkdown"
            :class-name="'playground-streamdown'"
            :controls="controlsValue"
            :is-animating="isAnimating"
            :line-numbers="lineNumbersValue"
            :link-safety="linkSafetyValue"
            :locale="locale"
            :mermaid="mermaidValue"
            :mode="mode"
            :plugins="plugins"
          />
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Streamdown, type StreamdownLocale } from "@brucekit/streamdown-vue";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import VegaLiteRenderer from "./components/VegaLiteRenderer.vue";

type SampleId =
  | "basic"
  | "streaming"
  | "code"
  | "table"
  | "mermaid"
  | "math"
  | "cjk"
  | "vega-lite"
  | "mixed";

type Sample = {
  id: SampleId;
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

const sampleDefinitions: Array<{ id: SampleId; markdown: string }> = [
  {
    id: "basic",
    markdown: defaultMarkdown,
  },
  {
    id: "streaming",
    markdown: `# Streaming sample\n\nThis sentence starts incomplete and then finishes with **bold text** and a table.\n\n| Name | Value |\n| --- | --- |\n| Alpha | 1 |\n| Beta | 2 |`,
  },
  {
    id: "code",
    markdown: "```ts\nconst greet = (name: string) => `Hello, ${name}`;\nconsole.log(greet('Streamdown'));\n```",
  },
  {
    id: "table",
    markdown: `| Feature | Status |\n| --- | --- |\n| Copy | Ready |\n| Download | Ready |\n| Fullscreen | Ready |`,
  },
  {
    id: "mermaid",
    markdown: "```mermaid\ngraph TD;\n  A[Stream] --> B[Markdown]\n  B --> C[Vue]\n```",
  },
  {
    id: "math",
    markdown: `Euler's identity: $e^{i\\pi} + 1 = 0$\n\n$$\\int_0^1 x^2 \\, dx = \\frac{1}{3}$$`,
  },
  {
    id: "cjk",
    markdown: `**これは太字です（bold）**\n\n- 中文项目【带括号】\n- 한국어 항목（괄호）`,
  },
  {
    id: "vega-lite",
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

const playgroundMessages = {
  en: {
    title: "Streamdown Vue Playground",
    subtitle: "Try Streamdown against local source with markdown, streaming, plugins, and controls.",
    sections: {
      markdown: "Markdown",
      preview: "Preview",
    },
    labels: {
      animated: "Animated",
      caret: "Caret",
      controls: "Controls",
      darkMode: "Dark mode",
      displaySettings: "Display settings",
      duration: "Duration (ms)",
      easing: "Easing",
      effect: "Effect",
      language: "Language",
      lineNumbers: "Line numbers",
      linkSafety: "Link safety",
      mode: "Mode",
      sample: "Sample",
      speed: "Speed (ms)",
      splitBy: "Split by",
    },
    options: {
      blurIn: "Blur in",
      caretBlock: "block",
      caretCircle: "circle",
      char: "Character",
      fadeIn: "Fade in",
      linear: "linear",
      none: "none",
      off: "off",
      on: "on",
      slideUp: "Slide up",
      static: "static",
      streaming: "streaming",
      word: "Word",
    },
    actions: {
      simulateStreaming: "Simulate streaming",
      stopStreaming: "Stop streaming",
    },
    status: {
      readyToStream: "Ready to stream",
      staticPreview: "Static preview",
      streamingPreview: "Streaming preview",
    },
    languages: {
      en: "English",
      "zh-CN": "简体中文",
    },
    samples: {
      basic: "Basic markdown",
      streaming: "Streaming sample",
      code: "Code block",
      table: "Table controls",
      mermaid: "Mermaid diagram",
      math: "Math sample",
      cjk: "CJK sample",
      "vega-lite": "Vega-Lite chart",
      mixed: "Mixed stress test",
    },
  },
  "zh-CN": {
    title: "Streamdown Vue 演练场",
    subtitle: "基于本地源码体验 Streamdown，验证 Markdown、流式渲染、插件与控件能力。",
    sections: {
      markdown: "Markdown",
      preview: "预览",
    },
    labels: {
      animated: "动画",
      caret: "光标",
      controls: "控件",
      darkMode: "深色模式",
      displaySettings: "显示设置",
      duration: "时长（毫秒）",
      easing: "缓动",
      effect: "效果",
      language: "语言",
      lineNumbers: "行号",
      linkSafety: "链接安全",
      mode: "模式",
      sample: "示例",
      speed: "速度（毫秒）",
      splitBy: "拆分方式",
    },
    options: {
      blurIn: "模糊进入",
      caretBlock: "方块",
      caretCircle: "圆点",
      char: "按字",
      fadeIn: "淡入",
      linear: "linear",
      none: "无",
      off: "关",
      on: "开",
      slideUp: "上滑",
      static: "静态",
      streaming: "流式",
      word: "按词",
    },
    actions: {
      simulateStreaming: "模拟流式输出",
      stopStreaming: "停止流式输出",
    },
    status: {
      readyToStream: "准备开始流式输出",
      staticPreview: "静态预览",
      streamingPreview: "流式预览中",
    },
    languages: {
      en: "English",
      "zh-CN": "简体中文",
    },
    samples: {
      basic: "基础 Markdown",
      streaming: "流式输出示例",
      code: "代码块",
      table: "表格控件",
      mermaid: "Mermaid 图表",
      math: "数学公式",
      cjk: "CJK 示例",
      "vega-lite": "Vega-Lite 图表",
      mixed: "混合压力测试",
    },
  },
} as const;

const locale = ref<StreamdownLocale>("en");
const t = computed(() => playgroundMessages[locale.value]);

const selectedSample = ref<SampleId>(sampleDefinitions[0].id);
const sourceMarkdown = ref(sampleDefinitions[0].markdown);
const renderedMarkdown = ref(sampleDefinitions[0].markdown);
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

const samples = computed<Sample[]>(() =>
  sampleDefinitions.map((sample) => ({
    ...sample,
    label: t.value.samples[sample.id],
  }))
);

const currentSample = computed(() =>
  sampleDefinitions.find((sample) => sample.id === selectedSample.value) ?? sampleDefinitions[0]
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
    return t.value.status.streamingPreview;
  }
  return mode.value === "streaming"
    ? t.value.status.readyToStream
    : t.value.status.staticPreview;
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

watch(
  darkMode,
  (value) => {
    document.documentElement.classList.toggle("dark", value);
  },
  { immediate: true }
);

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
