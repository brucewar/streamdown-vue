import {
  defineComponent,
  h,
  ref,
  onUnmounted,
  type PropType,
  inject,
} from "vue";
import { StreamdownKey } from "../../index";
import { useIcons } from "../icon-context";
import { useCn } from "../prefix-context";
import { useTranslations } from "../translations-context";
import { useCodeBlockContext } from "./context";

export const CodeBlockCopyButton = defineComponent({
  name: "CodeBlockCopyButton",
  props: {
    onCopy: {
      type: Function as PropType<() => void>,
      default: undefined,
    },
    onError: {
      type: Function as PropType<(error: Error) => void>,
      default: undefined,
    },
    timeout: {
      type: Number,
      default: 2000,
    },
    code: {
      type: String,
      default: undefined,
    },
    class: {
      type: [String, Object, Array] as PropType<any>,
      default: undefined,
    },
  },
  setup(props, { slots, attrs }) {
    const cn = useCn();
    const isCopied = ref(false);
    const timeoutRef = ref<number | null>(null);
    const { code: contextCode } = useCodeBlockContext();
    const streamdownContext = inject(StreamdownKey, { isAnimating: false } as any);
    const t = useTranslations();

    const copyToClipboard = async () => {
      const codeToCopy = props.code ?? contextCode;
      if (typeof window === "undefined" || !navigator?.clipboard?.writeText) {
        props.onError?.(new Error("Clipboard API not available"));
        return;
      }

      try {
        if (!isCopied.value) {
          await navigator.clipboard.writeText(codeToCopy);
          isCopied.value = true;
          props.onCopy?.();
          timeoutRef.value = window.setTimeout(
            () => {
              isCopied.value = false;
            },
            props.timeout
          );
        }
      } catch (error) {
        props.onError?.(error as Error);
      }
    };

    onUnmounted(() => {
      if (timeoutRef.value) {
        window.clearTimeout(timeoutRef.value);
      }
    });

    const icons = useIcons();

    return () => {
      const Icon = isCopied.value ? icons.CheckIcon : icons.CopyIcon;

      return h(
        "button",
        {
          class: cn(
            "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
            props.class
          ),
          "data-streamdown": "code-block-copy-button",
          disabled: streamdownContext.isAnimating,
          onClick: copyToClipboard,
          title: t.copyCode,
          type: "button",
          ...attrs,
        },
        slots.default ? slots.default() : [Icon({ size: 14 })]
      );
    };
  },
});
