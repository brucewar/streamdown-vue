import { defineComponent, h, type PropType } from "vue";
import { useCn } from "../prefix-context";
import { TableCopyDropdown } from "./copy-dropdown";
import { TableDownloadDropdown } from "./download-dropdown";
import { TableFullscreenButton } from "./fullscreen-button";

export const Table = defineComponent({
  name: "Table",
  props: {
    showControls: {
      type: Boolean,
      default: undefined,
    },
    showCopy: {
      type: Boolean,
      default: true,
    },
    showDownload: {
      type: Boolean,
      default: true,
    },
    showFullscreen: {
      type: Boolean,
      default: true,
    },
    class: {
      type: [String, Object, Array] as PropType<any>,
      default: undefined,
    },
  },
  setup(props, { slots, attrs }) {
    const cn = useCn();

    return () => {
      const hasCopy = props.showControls && props.showCopy;
      const hasDownload = props.showControls && props.showDownload;
      const hasFullscreen = props.showControls && props.showFullscreen;
      const hasAnyControl = hasCopy || hasDownload || hasFullscreen;

      return h(
        "div",
        {
          class: cn(
            "my-4 flex flex-col gap-2 rounded-lg border border-border bg-sidebar p-2"
          ),
          "data-streamdown": "table-wrapper",
        },
        [
          hasAnyControl
            ? h(
                "div",
                { class: cn("flex items-center justify-end gap-1") },
                [
                  hasCopy ? h(TableCopyDropdown) : null,
                  hasDownload ? h(TableDownloadDropdown) : null,
                  hasFullscreen
                    ? h(
                        TableFullscreenButton,
                        {
                          showCopy: hasCopy,
                          showDownload: hasDownload,
                        },
                        slots.default ? slots.default : undefined
                      )
                    : null,
                ]
              )
            : null,
          h(
            "div",
            {
              class: cn(
                "border-collapse overflow-x-auto overflow-y-auto rounded-md border border-border bg-background"
              ),
            },
            [
              h(
                "table",
                {
                  class: cn("w-full divide-y divide-border", props.class),
                  "data-streamdown": "table",
                  ...attrs,
                },
                slots.default ? slots.default() : []
              ),
            ]
          ),
        ]
      );
    };
  },
});
