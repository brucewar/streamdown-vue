import { defineComponent, h, defineAsyncComponent, Suspense, computed, provide, type PropType } from "vue";
import type { HighlightResult } from "../plugin-types";
import { useCn } from "../prefix-context";
import { CodeBlockBody } from "./body";
import { CodeBlockContainer } from "./container";
import { CodeBlockKey } from "./context";
import { CodeBlockHeader } from "./header";
import { CodeBlockSkeleton } from "./skeleton";

const trimTrailingNewlines = (str: string): string => {
  let end = str.length;
  while (end > 0 && str[end - 1] === "\n") {
    end--;
  }
  return str.slice(0, end);
};

const HighlightedCodeBlockBody = defineAsyncComponent(() =>
  import("./highlighted-body").then((mod) => mod.HighlightedCodeBlockBody)
);

export const CodeBlock = defineComponent({
  name: "CodeBlock",
  props: {
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    isIncomplete: {
      type: Boolean,
      default: false,
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
  setup(props, { slots, attrs }) {
    const cn = useCn();

    // Provide code context
    provide(CodeBlockKey, { code: props.code });

    // Remove trailing newlines to prevent empty line at end of code blocks
    const trimmedCode = computed(() => trimTrailingNewlines(props.code));

    // Memoize the raw fallback tokens to avoid recomputing on every render
    const raw = computed<HighlightResult>(() => ({
      bg: "transparent",
      fg: "inherit",
      tokens: trimmedCode.value.split("\n").map((line) => [
        {
          content: line,
          color: "inherit",
          bgColor: "transparent",
          htmlStyle: {},
          offset: 0,
        },
      ]),
    }));

    return () =>
      h(
        CodeBlockContainer,
        {
          isIncomplete: props.isIncomplete,
          language: props.language,
          class: props.class,
          ...attrs,
        },
        () => [
          h(CodeBlockHeader, { language: props.language }),
          slots.default
            ? h(
                "div",
                {
                  class: cn(
                    "pointer-events-none sticky top-2 z-10 -mt-10 flex h-8 items-center justify-end"
                  ),
                },
                [
                  h(
                    "div",
                    {
                      class: cn(
                        "pointer-events-auto flex shrink-0 items-center gap-2 rounded-md border border-sidebar bg-sidebar/80 px-1.5 py-1 supports-[backdrop-filter]:bg-sidebar/70 supports-[backdrop-filter]:backdrop-blur"
                      ),
                      "data-streamdown": "code-block-actions",
                    },
                    slots.default()
                  ),
                ]
              )
            : null,
          h(Suspense, null, {
            default: () =>
              h(HighlightedCodeBlockBody, {
                code: trimmedCode.value,
                language: props.language,
                lineNumbers: props.lineNumbers,
                raw: raw.value,
                startLine: props.startLine,
              }),
            fallback: () =>
              h(CodeBlockBody, {
                language: props.language,
                lineNumbers: props.lineNumbers,
                result: raw.value,
                startLine: props.startLine,
              }),
          }),
        ]
      );
  },
});
