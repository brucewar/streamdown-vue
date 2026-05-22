import type { MermaidConfig } from "mermaid";
import {
  defineComponent,
  h,
  onUnmounted,
  ref,
  Teleport,
  watch,
  type PropType,
} from "vue";
import { useStreamdownContext } from "../streamdown-context";
import { useIcons } from "../icon-context";
import { useCn } from "../prefix-context";
import { lockBodyScroll, unlockBodyScroll } from "../scroll-lock";
import { useTranslations } from "../translations-context";
import { Mermaid } from ".";

export const MermaidFullscreenButton = defineComponent({
  name: "MermaidFullscreenButton",
  props: {
    chart: {
      type: String,
      required: true,
    },
    config: {
      type: Object as PropType<MermaidConfig | undefined>,
      default: undefined,
    },
    onFullscreen: {
      type: Function as PropType<(() => void) | undefined>,
      default: undefined,
    },
    onExit: {
      type: Function as PropType<(() => void) | undefined>,
      default: undefined,
    },
    class: {
      type: [String, Object, Array] as PropType<any>,
      default: undefined,
    },
  },
  setup(props, { attrs }) {
    const { Maximize2Icon, XIcon } = useIcons();
    const cn = useCn();
    const isFullscreen = ref(false);
    const streamdownContext = useStreamdownContext();
    const t = useTranslations();

    const showPanZoomControls = (() => {
      if (typeof streamdownContext.controls === "boolean") {
        return streamdownContext.controls;
      }
      const mermaidCtl = streamdownContext.controls.mermaid;
      if (mermaidCtl === false) {
        return false;
      }
      if (mermaidCtl === true || mermaidCtl === undefined) {
        return true;
      }
      return mermaidCtl.panZoom !== false;
    })();

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        isFullscreen.value = false;
      }
    };

    watch(isFullscreen, (value, oldValue) => {
      if (value) {
        lockBodyScroll();
        document.addEventListener("keydown", handleEsc);
        props.onFullscreen?.();
        return;
      }

      document.removeEventListener("keydown", handleEsc);
      unlockBodyScroll();
      if (oldValue) {
        props.onExit?.();
      }
    });

    onUnmounted(() => {
      document.removeEventListener("keydown", handleEsc);
      unlockBodyScroll();
    });

    return () =>
      h("div", [
        h(
          "button",
          {
            class: cn(
              "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
              props.class
            ),
            disabled: streamdownContext.isAnimating,
            onClick: () => {
              isFullscreen.value = !isFullscreen.value;
            },
            title: t.viewFullscreen,
            type: "button",
            ...attrs,
          },
          [h(Maximize2Icon, { size: 14 })]
        ),
        isFullscreen.value
          ? h(Teleport, { to: "body" }, [
              h(
                "div",
                {
                  "aria-label": t.viewFullscreen,
                  "aria-modal": "true",
                  class: cn("fixed inset-0 z-50 flex flex-col bg-background"),
                  "data-streamdown": "mermaid-fullscreen",
                  onClick: () => {
                    isFullscreen.value = false;
                  },
                  onKeydown: (event: KeyboardEvent) => {
                    if (event.key === "Escape") {
                      isFullscreen.value = false;
                    }
                  },
                  role: "dialog",
                },
                [
                  h(
                    "button",
                    {
                      class: cn(
                        "absolute top-4 right-4 z-10 rounded-md p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                      ),
                      onClick: () => {
                        isFullscreen.value = false;
                      },
                      title: t.exitFullscreen,
                      type: "button",
                    },
                    [h(XIcon, { size: 20 })]
                  ),
                  h(
                    "div",
                    {
                      class: cn("flex min-h-0 flex-1 items-center justify-center p-4"),
                      onClick: (event: MouseEvent) => event.stopPropagation(),
                      onKeydown: (event: KeyboardEvent) => event.stopPropagation(),
                      role: "presentation",
                    },
                    [
                      h(Mermaid, {
                        chart: props.chart,
                        class: cn(
                          "size-full [&_svg]:max-h-full [&_svg]:max-w-full"
                        ),
                        config: props.config,
                        fullscreen: true,
                        showControls: showPanZoomControls,
                      }),
                    ]
                  ),
                ]
              ),
            ])
          : null,
      ]);
  },
});
