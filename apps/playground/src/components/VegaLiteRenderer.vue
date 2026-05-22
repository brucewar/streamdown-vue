<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import {
  CodeBlockContainer,
  CodeBlockHeader,
  type CustomRendererProps,
} from "@brucekit/streamdown-vue";

const props = defineProps<CustomRendererProps>();
const containerRef = ref<HTMLDivElement | null>(null);
const status = ref<"loading" | "ready" | "error">("loading");

const isLikelyCompleteJson = (value: string) => {
  const trimmed = value.trim();
  return trimmed.endsWith("}") || trimmed.endsWith("]");
};

watch(
  () => [props.code, props.isIncomplete] as const,
  async ([code, isIncomplete], _previous, onCleanup) => {
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });

    status.value = "loading";

    if (isIncomplete || !isLikelyCompleteJson(code)) {
      return;
    }

    await nextTick();

    if (cancelled || !containerRef.value) {
      return;
    }

    try {
      const spec = JSON.parse(code);
      const vegaEmbed = (await import("vega-embed")).default;

      if (cancelled || !containerRef.value) {
        return;
      }

      containerRef.value.innerHTML = "";
      await vegaEmbed(containerRef.value, spec, {
        actions: false,
        renderer: "svg",
        theme: "vox",
      });

      if (!cancelled) {
        status.value = "ready";
      }
    } catch {
      if (!cancelled) {
        status.value = "error";
      }
    }
  },
  { immediate: true }
);
</script>

<template>
  <CodeBlockContainer :is-incomplete="props.isIncomplete" :language="props.language">
    <CodeBlockHeader :language="props.language" />
    <div class="vega-lite-chart relative overflow-hidden rounded-md bg-white p-4">
      <div ref="containerRef" class="flex items-center justify-center" />
      <div
        v-if="props.isIncomplete || status === 'loading'"
        class="flex h-48 items-center justify-center rounded-md bg-muted"
      >
        <span class="text-muted-foreground text-sm">Loading chart...</span>
      </div>
      <p v-else-if="status === 'error'" class="p-4 text-sm text-destructive">
        Invalid Vega-Lite spec
      </p>
    </div>
  </CodeBlockContainer>
</template>

<style scoped>
.vega-lite-chart :deep(.vega-embed) {
  width: 100%;
}

.vega-lite-chart :deep(svg) {
  max-width: 100%;
}
</style>
