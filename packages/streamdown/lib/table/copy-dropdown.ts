import {
  defineComponent,
  h,
  ref,
  onMounted,
  onUnmounted,
  inject,
  type ExtractPropTypes,
  type PropType,
} from "vue";
import { StreamdownKey } from "../../index";
import { useIcons } from "../icon-context";
import { useCn } from "../prefix-context";
import { useTranslations } from "../translations-context";
import {
  extractTableDataFromElement,
  tableDataToCSV,
  tableDataToMarkdown,
  tableDataToTSV,
} from "./utils";

const tableCopyDropdownProps = {
  onCopy: {
    type: Function as PropType<(format: "csv" | "tsv" | "md") => void>,
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
  class: {
    type: [String, Object, Array] as PropType<any>,
    default: undefined,
  },
} as const;

export type TableCopyDropdownProps = ExtractPropTypes<
  typeof tableCopyDropdownProps
>;

export const TableCopyDropdown = defineComponent({
  name: "TableCopyDropdown",
  props: tableCopyDropdownProps,
  setup(props, { slots, attrs }) {
    const cn = useCn();
    const isOpen = ref(false);
    const isCopied = ref(false);
    const dropdownRef = ref<HTMLDivElement | null>(null);
    const timeoutRef = ref<number | null>(null);
    const streamdownContext = inject(StreamdownKey, { isAnimating: false } as any);
    const t = useTranslations();
    const icons = useIcons();

    const writeTableToClipboard = async (content: string, html: string) => {
      if (
        typeof window === "undefined" ||
        typeof navigator === "undefined" ||
        !navigator.clipboard
      ) {
        throw new Error("Clipboard API not available");
      }

      const { clipboard } = navigator;

      if (clipboard.write && typeof ClipboardItem !== "undefined") {
        try {
          const clipboardItemData = new ClipboardItem({
            "text/plain": new Blob([content], { type: "text/plain" }),
            "text/html": new Blob([html], { type: "text/html" }),
          });

          await clipboard.write([clipboardItemData]);
          return;
        } catch (error) {
          if (!clipboard.writeText) {
            throw error;
          }
        }
      }

      if (!clipboard.writeText) {
        throw new Error("Clipboard API not available");
      }

      await clipboard.writeText(content);
    };

    const copyTableData = async (format: "csv" | "tsv" | "md") => {
      try {
        const tableContainer = dropdownRef.value?.closest(
          '[data-streamdown="table-wrapper"], [data-streamdown="table-fullscreen"]'
        );
        const tableElement = tableContainer?.querySelector(
          "table"
        ) as HTMLTableElement | null;

        if (!tableElement) {
          props.onError?.(new Error("Table not found"));
          return;
        }

        const tableData = extractTableDataFromElement(tableElement);

        const formatters = {
          csv: tableDataToCSV,
          tsv: tableDataToTSV,
          md: tableDataToMarkdown,
        };
        const formatter = formatters[format] || tableDataToMarkdown;
        const content = formatter(tableData);

        await writeTableToClipboard(content, tableElement.outerHTML);
        isCopied.value = true;
        isOpen.value = false;
        props.onCopy?.(format);
        timeoutRef.value = window.setTimeout(
          () => {
            isCopied.value = false;
          },
          props.timeout
        );
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
      if (timeoutRef.value) {
        window.clearTimeout(timeoutRef.value);
      }
    });

    return () => {
      const Icon = isCopied.value ? icons.CheckIcon : icons.CopyIcon;

      return h(
        "div",
        {
          class: cn("relative"),
          ref: dropdownRef,
        },
        [
          h(
            "button",
            {
              class: cn(
                "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
                props.class
              ),
              disabled: streamdownContext.isAnimating,
              onClick: () => {
                isOpen.value = !isOpen.value;
              },
              title: t.copyTable,
              type: "button",
              ...attrs,
            },
            slots.default ? slots.default() : [Icon({ height: 14, width: 14 })]
          ),
          isOpen.value
            ? h(
                "div",
                {
                  class: cn(
                    "absolute top-full right-0 z-20 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-background shadow-lg"
                  ),
                },
                [
                  h(
                    "button",
                    {
                      class: cn(
                        "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
                      ),
                      onClick: () => copyTableData("md"),
                      title: t.copyTableAsMarkdown,
                      type: "button",
                    },
                    t.tableFormatMarkdown
                  ),
                  h(
                    "button",
                    {
                      class: cn(
                        "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
                      ),
                      onClick: () => copyTableData("csv"),
                      title: t.copyTableAsCsv,
                      type: "button",
                    },
                    t.tableFormatCsv
                  ),
                  h(
                    "button",
                    {
                      class: cn(
                        "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
                      ),
                      onClick: () => copyTableData("tsv"),
                      title: t.copyTableAsTsv,
                      type: "button",
                    },
                    t.tableFormatTsv
                  ),
                ]
              )
            : null,
        ]
      );
    };
  },
});
