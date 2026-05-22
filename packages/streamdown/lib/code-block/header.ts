import { defineComponent, h } from "vue";
import { useCn } from "../prefix-context";

export const CodeBlockHeader = defineComponent({
  name: "CodeBlockHeader",
  props: {
    language: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const cn = useCn();
    return () =>
      h(
        "div",
        {
          class: cn("flex h-8 items-center text-muted-foreground text-xs"),
          "data-language": props.language,
          "data-streamdown": "code-block-header",
        },
        [
          h(
            "span",
            { class: cn("ml-1 font-mono lowercase") },
            props.language
          ),
        ]
      );
  },
});
