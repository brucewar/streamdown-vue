import type { MermaidConfig } from "mermaid";
import { defineComponent, h, inject, ref, watch, computed, type PropType } from "vue";
import { useDeferredRender } from "../../hooks/use-deferred-render";
import { StreamdownKey } from "../../index";
import { useMermaidPlugin } from "../plugin-context";
import { useCn } from "../prefix-context";
import { PanZoom } from "./pan-zoom";

export const Mermaid = defineComponent({
  name: "Mermaid",
  props: {
    chart: {
      type: String,
      required: true,
    },
    config: {
      type: Object as PropType<MermaidConfig | undefined>,
      default: undefined,
    },
    fullscreen: {
      type: Boolean,
      default: false,
    },
    showControls: {
      type: Boolean,
      default: true,
    },
    class: {
      type: [String, Object, Array] as PropType<any>,
      default: undefined,
    },
  },
  setup(props) {
    const cn = useCn();
    const error = ref<string | null>(null);
    const isLoading = ref(false);
    const svgContent = ref("");
    const lastValidSvg = ref("");
    const retryCount = ref(0);
    const streamdownContext = inject(StreamdownKey, { mermaid: undefined } as any);
    const mermaidContext = streamdownContext.mermaid;
    const mermaidPlugin = useMermaidPlugin();
    const ErrorComponent = mermaidContext?.errorComponent;

    // Use deferred render hook for optimal performance
    const { shouldRender, containerRef } = useDeferredRender({
      immediate: props.fullscreen,
    });

    watch(
      () => [props.chart, props.config, retryCount.value, shouldRender.value, mermaidPlugin],
      async () => {
        // Only render when shouldRender is true
        if (!shouldRender.value) {
          return;
        }

        // If no mermaid plugin, show error
        if (!mermaidPlugin) {
          error.value =
            "Mermaid plugin not available. Please add the mermaid plugin to enable diagram rendering.";
          return;
        }

        try {
          error.value = null;
          isLoading.value = true;

          // Get mermaid instance from plugin
          const mermaid = mermaidPlugin.getMermaid(props.config);

          // Use a stable ID based on chart content hash and timestamp to ensure uniqueness
          const chartHash = props.chart.split("").reduce((acc, char) => {
            return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
          }, 0);
          const uniqueId = `mermaid-${Math.abs(chartHash)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

          const { svg } = await mermaid.render(uniqueId, props.chart);

          // Update both current and last valid SVG
          svgContent.value = svg;
          lastValidSvg.value = svg;
        } catch (err) {
          // Only set error if we don't have any valid SVG
          if (!(lastValidSvg.value || svgContent.value)) {
            error.value =
              err instanceof Error ? err.message : "Failed to render Mermaid chart";
          }
        } finally {
          isLoading.value = false;
        }
      },
      { immediate: true, deep: true }
    );

    const displaySvg = computed(() => svgContent.value || lastValidSvg.value);

    return () => {
      if (!(shouldRender.value || svgContent.value || lastValidSvg.value)) {
        return h("div", {
          class: cn("my-4 min-h-[200px]", props.class),
          ref: containerRef,
        });
      }

      if (isLoading.value && !svgContent.value && !lastValidSvg.value) {
        return h(
          "div",
          {
            class: cn("my-4 flex justify-center p-4", props.class),
            ref: containerRef,
          },
          [
            h("div", { class: cn("flex items-center space-x-2 text-muted-foreground") }, [
              h("div", {
                class: cn("h-4 w-4 animate-spin rounded-full border-current border-b-2"),
              }),
              h("span", { class: cn("text-sm") }, "Loading diagram..."),
            ]),
          ]
        );
      }

      if (error.value && !svgContent.value && !lastValidSvg.value) {
        const retry = () => {
          retryCount.value += 1;
        };

        if (ErrorComponent) {
          return h("div", { ref: containerRef }, [
            h(ErrorComponent, { chart: props.chart, error: error.value, retry }),
          ]);
        }

        return h(
          "div",
          {
            class: cn("rounded-md bg-red-50 p-4", props.class),
            ref: containerRef,
          },
          [
            h("p", { class: cn("font-mono text-red-700 text-sm") }, `Mermaid Error: ${error.value}`),
            h("details", { class: cn("mt-2") }, [
              h("summary", { class: cn("cursor-pointer text-red-600 text-xs") }, "Show Code"),
              h(
                "pre",
                {
                  class: cn(
                    "mt-2 overflow-x-auto rounded bg-red-100 p-2 text-red-800 text-xs"
                  ),
                },
                props.chart
              ),
            ]),
          ]
        );
      }

      return h(
        "div",
        {
          class: cn("size-full", props.class),
          "data-streamdown": "mermaid",
          ref: containerRef,
        },
        [
          h(
            PanZoom,
            {
              class: cn(
                props.fullscreen ? "size-full overflow-hidden" : "overflow-hidden",
                props.class
              ),
              fullscreen: props.fullscreen,
              maxZoom: 3,
              minZoom: 0.5,
              showControls: props.showControls,
              zoomStep: 0.1,
            },
            {
              default: () => [
                h("div", {
                  "aria-label": "Mermaid chart",
                  class: cn(
                    "flex justify-center [&_svg]:max-w-full",
                    props.fullscreen
                      ? "size-full items-center [&_svg]:max-h-full"
                      : null
                  ),
                  innerHTML: displaySvg.value,
                  role: "img",
                }),
              ],
            }
          ),
        ]
      );
    };
  },
});
