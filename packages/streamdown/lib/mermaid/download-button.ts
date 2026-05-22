import type { MermaidConfig } from "mermaid";
import {
  defineComponent,
  h,
  onMounted,
  onUnmounted,
  ref,
  type PropType,
  type VNodeChild,
} from "vue";
import { useStreamdownContext } from "../streamdown-context";
import { useIcons } from "../icon-context";
import { useMermaidPlugin } from "../plugin-context";
import { useCn } from "../prefix-context";
import { useTranslations } from "../translations-context";
import { save } from "../utils";
import { svgToPngBlob } from "./utils";

export interface MermaidDownloadDropdownProps {
  chart: string;
  children?: VNodeChild;
  className?: string;
  config?: MermaidConfig;
  onDownload?: (format: "mmd" | "png" | "svg") => void;
  onError?: (error: Error) => void;
}

export const MermaidDownloadDropdown = defineComponent({
  name: "MermaidDownloadDropdown",
  props: {
    chart: {
      type: String,
      required: true,
    },
    children: {
      type: null,
      default: undefined,
    },
    className: {
      type: String,
      default: undefined,
    },
    config: {
      type: Object as PropType<MermaidConfig | undefined>,
      default: undefined,
    },
    onDownload: {
      type: Function as PropType<
        ((format: "mmd" | "png" | "svg") => void) | undefined
      >,
      default: undefined,
    },
    onError: {
      type: Function as PropType<((error: Error) => void) | undefined>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const cn = useCn();
    const isOpen = ref(false);
    const dropdownRef = ref<HTMLDivElement | null>(null);
    const streamdownContext = useStreamdownContext();
    const icons = useIcons();
    const mermaidPlugin = useMermaidPlugin();
    const t = useTranslations();

    const downloadMermaid = async (format: "mmd" | "png" | "svg") => {
      try {
        if (format === "mmd") {
          save("diagram.mmd", props.chart, "text/plain");
          isOpen.value = false;
          props.onDownload?.(format);
          return;
        }

        if (!mermaidPlugin) {
          props.onError?.(new Error("Mermaid plugin not available"));
          return;
        }

        const mermaid = mermaidPlugin.getMermaid(props.config);
        const chartHash = props.chart.split("").reduce((acc, char) => {
          return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
        }, 0);
        const uniqueId = `mermaid-${Math.abs(chartHash)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, props.chart);

        if (!svg) {
          props.onError?.(
            new Error("SVG not found. Please wait for the diagram to render.")
          );
          return;
        }

        if (format === "svg") {
          save("diagram.svg", svg, "image/svg+xml");
          isOpen.value = false;
          props.onDownload?.(format);
          return;
        }

        if (format === "png") {
          const blob = await svgToPngBlob(svg);
          save("diagram.png", blob, "image/png");
          props.onDownload?.(format);
          isOpen.value = false;
        }
      } catch (error) {
        props.onError?.(error as Error);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const path = event.composedPath();
      if (dropdownRef.value && !path.includes(dropdownRef.value)) {
        isOpen.value = false;
      }
    };

    onMounted(() => {
      document.addEventListener("mousedown", handleClickOutside);
    });

    onUnmounted(() => {
      document.removeEventListener("mousedown", handleClickOutside);
    });

    return () =>
      h(
        "div",
        { class: cn("relative"), ref: dropdownRef },
        [
          h(
            "button",
            {
              class: cn(
                "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
                props.className
              ),
              disabled: streamdownContext.isAnimating,
              onClick: () => {
                isOpen.value = !isOpen.value;
              },
              title: t.downloadDiagram,
              type: "button",
            },
            slots.default?.() ?? [h(icons.DownloadIcon, { size: 14 })]
          ),
          isOpen.value
            ? h(
                "div",
                {
                  class: cn(
                    "absolute top-full right-0 z-10 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-background shadow-lg"
                  ),
                },
                [
                  h(
                    "button",
                    {
                      class: cn(
                        "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
                      ),
                      onClick: () => downloadMermaid("svg"),
                      title: t.downloadDiagramAsSvg,
                      type: "button",
                    },
                    t.mermaidFormatSvg
                  ),
                  h(
                    "button",
                    {
                      class: cn(
                        "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
                      ),
                      onClick: () => downloadMermaid("png"),
                      title: t.downloadDiagramAsPng,
                      type: "button",
                    },
                    t.mermaidFormatPng
                  ),
                  h(
                    "button",
                    {
                      class: cn(
                        "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
                      ),
                      onClick: () => downloadMermaid("mmd"),
                      title: t.downloadDiagramAsMmd,
                      type: "button",
                    },
                    t.mermaidFormatMmd
                  ),
                ]
              )
            : null,
        ]
      );
  },
});
