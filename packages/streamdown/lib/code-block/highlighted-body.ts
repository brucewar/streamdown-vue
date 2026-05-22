import { defineComponent, h, ref, watch, inject, type PropType } from "vue";
import type { BundledLanguage } from "shiki";
import { StreamdownKey } from "../../index";
import { useCodePlugin } from "../plugin-context";
import type { HighlightResult } from "../plugin-types";
import { CodeBlockBody } from "./body";

export const HighlightedCodeBlockBody = defineComponent({
  name: "HighlightedCodeBlockBody",
  props: {
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    raw: {
      type: Object as PropType<HighlightResult>,
      required: true,
    },
    startLine: {
      type: Number,
      default: undefined,
    },
    lineNumbers: {
      type: Boolean,
      default: undefined,
    },
    class: {
      type: [String, Object, Array] as PropType<any>,
      default: undefined,
    },
  },
  setup(props, { attrs }) {
    // Provide a default fallback value for StreamdownKey using partial type matching
    const streamdownContext = inject(StreamdownKey, { shikiTheme: ["github-light", "github-dark"] as any } as any);
    const codePlugin = useCodePlugin();
    const result = ref<HighlightResult>(props.raw);

    watch(
      () => [props.code, props.language, streamdownContext.shikiTheme, props.raw],
      () => {
        if (!codePlugin) {
          result.value = props.raw;
          return;
        }

        const cachedResult = codePlugin.highlight(
          {
            code: props.code,
            language: props.language as BundledLanguage,
            themes: streamdownContext.shikiTheme,
          },
          (highlightedResult) => {
            result.value = highlightedResult;
          }
        );

        if (cachedResult) {
          result.value = cachedResult;
        }
      },
      { immediate: true, deep: true }
    );

    return () =>
      h(CodeBlockBody, {
        class: props.class,
        language: props.language,
        lineNumbers: props.lineNumbers,
        result: result.value,
        startLine: props.startLine,
        ...attrs,
      });
  },
});
