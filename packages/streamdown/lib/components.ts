import {
  defineAsyncComponent,
  defineComponent,
  Fragment,
  h,
  isVNode,
  ref,
  type Component,
  type PropType,
  type VNode,
  type VNodeChild,
} from "vue";
import { type ControlsConfig } from "../index";
import { useStreamdownContext } from "../lib/streamdown-context";
import { useIsCodeFenceIncomplete } from "./block-incomplete-context";
import { CodeBlock } from "./code-block";
import { CodeBlockCopyButton } from "./code-block/copy-button";
import { CodeBlockDownloadButton } from "./code-block/download-button";
import { CodeBlockSkeleton } from "./code-block/skeleton";
import { ImageComponent } from "./image";
import { LinkSafetyModal } from "./link-modal";
import type { ExtraProps, Options } from "./markdown";
import { MermaidDownloadDropdown } from "./mermaid/download-button";
import { MermaidFullscreenButton } from "./mermaid/fullscreen-button";
import { useMermaidPlugin, usePlugins } from "./plugin-context";
import { useCn } from "./prefix-context";
import { Table } from "./table";

const START_LINE_PATTERN = /startLine=(\d+)/;
const NO_LINE_NUMBERS_PATTERN = /\bnoLineNumbers\b/;
const LANGUAGE_REGEX = /language-([^\s]+)/;

const Mermaid = defineAsyncComponent(() =>
  import("./mermaid").then((mod) => mod.Mermaid)
);

interface MarkdownPoint {
  column?: number;
  line?: number;
}

interface MarkdownPosition {
  end?: MarkdownPoint;
  start?: MarkdownPoint;
}

interface MarkdownNode {
  children?: MarkdownNode[];
  position?: MarkdownPosition;
  properties?: {
    className?: string;
    dataFootnoteBackref?: unknown;
    "data-footnote-backref"?: unknown;
    metastring?: string;
    metaString?: string;
  };
  tagName?: string;
  type?: string;
  value?: string;
}

type WithNode = {
  children?: VNodeChild;
  class?: unknown;
  className?: string;
  node?: MarkdownNode;
};

const normalizeClass = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string").join(" ");
  }
  return undefined;
};

function sameNodePosition(prev?: MarkdownNode, next?: MarkdownNode): boolean {
  if (!(prev?.position || next?.position)) {
    return true;
  }
  if (!(prev?.position && next?.position)) {
    return false;
  }

  const prevStart = prev.position.start;
  const nextStart = next.position.start;
  const prevEnd = prev.position.end;
  const nextEnd = next.position.end;

  return (
    prevStart?.line === nextStart?.line &&
    prevStart?.column === nextStart?.column &&
    prevEnd?.line === nextEnd?.line &&
    prevEnd?.column === nextEnd?.column
  );
}

function sameClassAndNode(
  prev: { className?: string; node?: MarkdownNode },
  next: { className?: string; node?: MarkdownNode }
) {
  return (
    prev.className === next.className && sameNodePosition(prev.node, next.node)
  );
}

const shouldShowControls = (
  config: ControlsConfig,
  type: "table" | "code" | "mermaid"
) => {
  if (typeof config === "boolean") {
    return config;
  }

  return config[type] !== false;
};

const shouldShowTableControl = (
  config: ControlsConfig,
  controlType: "copy" | "download" | "fullscreen"
): boolean => {
  if (typeof config === "boolean") {
    return config;
  }

  const tableConfig = config.table;

  if (tableConfig === false) {
    return false;
  }

  if (tableConfig === true || tableConfig === undefined) {
    return true;
  }

  return tableConfig[controlType] !== false;
};

const shouldShowCodeControl = (
  config: ControlsConfig,
  controlType: "copy" | "download"
): boolean => {
  if (typeof config === "boolean") {
    return config;
  }

  const codeConfig = config.code;

  if (codeConfig === false) {
    return false;
  }

  if (codeConfig === true || codeConfig === undefined) {
    return true;
  }

  return codeConfig[controlType] !== false;
};

const shouldShowMermaidControl = (
  config: ControlsConfig,
  controlType: "download" | "copy" | "fullscreen" | "panZoom"
): boolean => {
  if (typeof config === "boolean") {
    return config;
  }

  const mermaidConfig = config.mermaid;

  if (mermaidConfig === false) {
    return false;
  }

  if (mermaidConfig === true || mermaidConfig === undefined) {
    return true;
  }

  return mermaidConfig[controlType] !== false;
};

const normalizeVNodeChild = (child: VNodeChild): VNodeChild => {
  if (!isVNode(child)) {
    return child;
  }

  const props = (child.props ?? {}) as Record<string, unknown>;
  const propChildren = props.children as VNodeChild | undefined;
  if (propChildren === undefined || child.children !== null) {
    return child;
  }

  const normalizedChildren = getChildrenArray(propChildren);
  const nextProps = { ...props };

  if (typeof child.type === "string") {
    delete nextProps.children;
  }

  return h(child.type as Component | string, nextProps, normalizedChildren);
};

const getChildrenArray = (children?: VNodeChild): VNodeChild[] => {
  if (children === undefined || children === null) {
    return [];
  }

  if (Array.isArray(children)) {
    return children.map(normalizeVNodeChild);
  }

  if (typeof children === "object" && !isVNode(children)) {
    const slotValues = Object.values(children as Record<string, unknown>).flatMap(
      (slotValue) => {
        if (typeof slotValue === "function") {
          const result = slotValue();
          return Array.isArray(result) ? result : [result];
        }
        return slotValue === undefined || slotValue === null ? [] : [slotValue as VNodeChild];
      }
    );

    return slotValues
      .filter((value): value is VNodeChild => value !== undefined && value !== null)
      .map(normalizeVNodeChild);
  }

  return [normalizeVNodeChild(children)];
};

const isVNodeWithProps = (value: VNodeChild): value is VNode => isVNode(value);

const withNodeProps = (value: VNode): Record<string, unknown> =>
  ((value.props ?? {}) as Record<string, unknown>);

const MarkdownOl = defineComponent({
  name: "MarkdownOl",
  props: {
    children: { type: null, default: undefined },
    className: { type: String, default: undefined },
    node: { type: Object as PropType<MarkdownNode | undefined>, default: undefined },
  },
  setup(props, { attrs }) {
    const cn = useCn();
    return () => {
      const { class: classAttr, ...restAttrs } = attrs;

      return h(
        "ol",
        {
          class: cn(
            "list-inside list-decimal whitespace-normal [li_&]:pl-6",
            props.className,
            normalizeClass(classAttr)
          ),
          "data-streamdown": "ordered-list",
          ...restAttrs,
        },
        getChildrenArray(props.children)
      );
    };
  },
});

const MarkdownLi = defineComponent({
  name: "MarkdownLi",
  props: {
    children: { type: null, default: undefined },
    className: { type: String, default: undefined },
    node: { type: Object as PropType<MarkdownNode | undefined>, default: undefined },
  },
  setup(props, { attrs }) {
    const cn = useCn();
    return () => {
      const { class: classAttr, ...restAttrs } = attrs;

      return h(
        "li",
        {
          class: cn("py-1 [&>p]:inline", props.className, normalizeClass(classAttr)),
          "data-streamdown": "list-item",
          ...restAttrs,
        },
        getChildrenArray(props.children)
      );
    };
  },
});

const MarkdownUl = defineComponent({
  name: "MarkdownUl",
  props: {
    children: { type: null, default: undefined },
    className: { type: String, default: undefined },
    node: { type: Object as PropType<MarkdownNode | undefined>, default: undefined },
  },
  setup(props, { attrs }) {
    const cn = useCn();
    return () => {
      const { class: classAttr, ...restAttrs } = attrs;

      return h(
        "ul",
        {
          class: cn(
            "list-inside list-disc whitespace-normal [li_&]:pl-6",
            props.className,
            normalizeClass(classAttr)
          ),
          "data-streamdown": "unordered-list",
          ...restAttrs,
        },
        getChildrenArray(props.children)
      );
    };
  },
});

const MarkdownHr = defineComponent({
  name: "MarkdownHr",
  props: {
    className: { type: String, default: undefined },
    node: { type: Object as PropType<MarkdownNode | undefined>, default: undefined },
  },
  setup(props, { attrs }) {
    const cn = useCn();
    return () =>
      h("hr", {
        class: cn("my-6 border-border", props.className),
        "data-streamdown": "horizontal-rule",
        ...attrs,
      });
  },
});

const MarkdownStrong = defineComponent({
  name: "MarkdownStrong",
  props: {
    children: { type: null, default: undefined },
    className: { type: String, default: undefined },
    node: { type: Object as PropType<MarkdownNode | undefined>, default: undefined },
  },
  setup(props, { attrs }) {
    const cn = useCn();
    return () =>
      h(
        "span",
        {
          class: cn("font-semibold", props.className),
          "data-streamdown": "strong",
          ...attrs,
        },
        getChildrenArray(props.children)
      );
  },
});

const MarkdownA = defineComponent({
  name: "MarkdownA",
  props: {
    children: { type: null, default: undefined },
    className: { type: String, default: undefined },
    href: { type: String, default: undefined },
    node: { type: Object as PropType<MarkdownNode | undefined>, default: undefined },
  },
  setup(props, { attrs }) {
    const cn = useCn();
    const { linkSafety } = useStreamdownContext();
    const isModalOpen = ref(false);
    const isIncomplete = props.href === "streamdown:incomplete-link";
    const isInternalAnchor = () => props.href?.startsWith("#") === true;

    const handleClick = async (event: MouseEvent) => {
      if (!(linkSafety?.enabled && props.href) || isIncomplete || isInternalAnchor()) {
        return;
      }

      event.preventDefault();

      if (linkSafety.onLinkCheck) {
        const isAllowed = await linkSafety.onLinkCheck(props.href);
        if (isAllowed) {
          window.open(props.href, "_blank", "noreferrer");
          return;
        }
      }

      isModalOpen.value = true;
    };

    const handleConfirm = () => {
      if (props.href) {
        window.open(props.href, "_blank", "noreferrer");
      }
    };

    const handleCloseModal = () => {
      isModalOpen.value = false;
    };

    return () => {
      const modalProps = {
        url: props.href ?? "",
        isOpen: isModalOpen.value,
        onClose: handleCloseModal,
        onConfirm: handleConfirm,
      };

      if (linkSafety?.enabled && props.href && !isInternalAnchor()) {
        return h(Fragment, null, [
          h(
            "button",
            {
              class: cn(
                "wrap-anywhere appearance-none text-left font-medium text-primary underline",
                props.className
              ),
              "data-incomplete": isIncomplete,
              "data-streamdown": "link",
              onClick: handleClick,
              type: "button",
            },
            getChildrenArray(props.children)
          ),
          linkSafety.renderModal
            ? (linkSafety.renderModal(modalProps) as VNodeChild)
            : h(LinkSafetyModal, modalProps),
        ]);
      }

      return h(
        "a",
        {
          class: cn(
            "wrap-anywhere font-medium text-primary underline",
            props.className
          ),
          "data-incomplete": isIncomplete,
          "data-streamdown": "link",
          href: props.href,
          rel: "noreferrer",
          target: "_blank",
          ...attrs,
        },
        getChildrenArray(props.children)
      );
    };
  },
});

const createHeading = (tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6", className: string, name: string, dataAttr: string) =>
  defineComponent({
    name,
    props: {
      children: { type: null, default: undefined },
      className: { type: String, default: undefined },
      node: { type: Object as PropType<MarkdownNode | undefined>, default: undefined },
    },
    setup(props, { attrs }) {
      const cn = useCn();
      return () =>
        h(
          tag,
          {
            class: cn(className, props.className),
            "data-streamdown": dataAttr,
            ...attrs,
          },
          getChildrenArray(props.children)
        );
    },
  });

const MarkdownH1 = createHeading("h1", "mt-6 mb-2 font-semibold text-3xl", "MarkdownH1", "heading-1");
const MarkdownH2 = createHeading("h2", "mt-6 mb-2 font-semibold text-2xl", "MarkdownH2", "heading-2");
const MarkdownH3 = createHeading("h3", "mt-6 mb-2 font-semibold text-xl", "MarkdownH3", "heading-3");
const MarkdownH4 = createHeading("h4", "mt-6 mb-2 font-semibold text-lg", "MarkdownH4", "heading-4");
const MarkdownH5 = createHeading("h5", "mt-6 mb-2 font-semibold text-base", "MarkdownH5", "heading-5");
const MarkdownH6 = createHeading("h6", "mt-6 mb-2 font-semibold text-sm", "MarkdownH6", "heading-6");

const MarkdownTable = defineComponent({
  name: "MarkdownTable",
  props: {
    children: { type: null, default: undefined },
    className: { type: String, default: undefined },
    node: { type: Object as PropType<MarkdownNode | undefined>, default: undefined },
  },
  setup(props, { attrs }) {
    const { controls: controlsConfig } = useStreamdownContext();

    return () =>
      h(
        Table,
        {
          class: props.className,
          showControls: shouldShowControls(controlsConfig, "table"),
          showCopy: shouldShowTableControl(controlsConfig, "copy"),
          showDownload: shouldShowTableControl(controlsConfig, "download"),
          showFullscreen: shouldShowTableControl(controlsConfig, "fullscreen"),
          ...attrs,
        },
        {
          default: () => getChildrenArray(props.children),
        }
      );
  },
});

const createTagComponent = (
  tag: string,
  name: string,
  dataAttr: string,
  className?: string
) =>
  defineComponent({
    name,
    props: {
      children: { type: null, default: undefined },
      className: { type: String, default: undefined },
      node: { type: Object as PropType<MarkdownNode | undefined>, default: undefined },
    },
    setup(props, { attrs }) {
      const cn = useCn();
      return () =>
        h(
          tag,
          {
            class: cn(className, props.className),
            "data-streamdown": dataAttr,
            ...attrs,
          },
          getChildrenArray(props.children)
        );
    },
  });

const MarkdownThead = createTagComponent("thead", "MarkdownThead", "table-header", "bg-muted/80");
const MarkdownTbody = createTagComponent("tbody", "MarkdownTbody", "table-body", "divide-y divide-border");
const MarkdownTr = createTagComponent("tr", "MarkdownTr", "table-row", "border-border");
const MarkdownTh = createTagComponent("th", "MarkdownTh", "table-header-cell", "whitespace-nowrap px-4 py-2 text-left font-semibold text-sm");
const MarkdownTd = createTagComponent("td", "MarkdownTd", "table-cell", "px-4 py-2 text-sm");
const MarkdownBlockquote = createTagComponent(
  "blockquote",
  "MarkdownBlockquote",
  "blockquote",
  "my-4 border-muted-foreground/30 border-l-4 pl-4 text-muted-foreground italic"
);
const MarkdownSup = createTagComponent("sup", "MarkdownSup", "superscript", "text-sm");
const MarkdownSub = createTagComponent("sub", "MarkdownSub", "subscript", "text-sm");

const hasMeaningfulContent = (child: VNodeChild): boolean => {
  if (typeof child === "string") {
    return child.trim() !== "";
  }
  return child !== null && child !== undefined;
};

const isFootnoteBackref = (child: VNodeChild): boolean => {
  if (!isVNodeWithProps(child)) {
    return false;
  }
  return withNodeProps(child)["data-footnote-backref"] !== undefined;
};

const hastNodeHasFootnoteContent = (node: MarkdownNode): boolean => {
  if (node.type === "text") {
    return node.value?.trim() !== "";
  }

  if (node.tagName === "a") {
    const properties = node.properties ?? {};
    if (
      properties.dataFootnoteBackref !== undefined ||
      properties["data-footnote-backref"] !== undefined
    ) {
      return false;
    }
  }

  if (!node.children?.length) {
    return node.tagName !== undefined;
  }

  return node.children.some(hastNodeHasFootnoteContent);
};

const isEmptyFootnote = (listItem: VNodeChild): boolean => {
  if (!isVNodeWithProps(listItem)) {
    return false;
  }

  const listItemNode = withNodeProps(listItem).node as MarkdownNode | undefined;
  if (listItemNode?.children) {
    return !listItemNode.children.some(hastNodeHasFootnoteContent);
  }

  const itemChildren = getChildrenArray(listItem.children);
  let hasContent = false;
  let hasBackref = false;

  for (const itemChild of itemChildren) {
    if (!itemChild) {
      continue;
    }

    if (typeof itemChild === "string") {
      if (itemChild.trim() !== "") {
        hasContent = true;
      }
    } else if (isVNodeWithProps(itemChild)) {
      if (isFootnoteBackref(itemChild)) {
        hasBackref = true;
      } else {
        const grandChildren = getChildrenArray(itemChild.children);
        for (const grandChild of grandChildren) {
          if (typeof grandChild === "string" && grandChild.trim() !== "") {
            hasContent = true;
            break;
          }
          if (isVNodeWithProps(grandChild) && !isFootnoteBackref(grandChild)) {
            hasContent = true;
            break;
          }
        }
      }
    }
  }

  return hasBackref && !hasContent;
};

const MarkdownSection = defineComponent({
  name: "MarkdownSection",
  props: {
    children: { type: null, default: undefined },
    className: { type: String, default: undefined },
    node: { type: Object as PropType<MarkdownNode | undefined>, default: undefined },
  },
  setup(props, { attrs }) {
    return () => {
      const isFootnotesSection = Object.prototype.hasOwnProperty.call(
        attrs,
        "data-footnotes"
      );

      if (!isFootnotesSection) {
        return h(
          "section",
          {
            class: props.className,
            ...attrs,
          },
          getChildrenArray(props.children)
        );
      }

      const processedChildren = getChildrenArray(props.children).map((child) => {
        if (!isVNodeWithProps(child)) {
          return child;
        }

        const typeName =
          typeof child.type === "object" && child.type !== null
            ? (child.type as { name?: string }).name
            : undefined;
        const childProps = withNodeProps(child);
        const childNode = childProps.node as MarkdownNode | undefined;

        if (typeName === "MarkdownOl" || childNode?.tagName === "ol") {
          const listChildren = getChildrenArray(
            (childProps.children as VNodeChild | undefined) ?? child.children
          );
          const filteredListChildren = listChildren.filter(
            (listItem) => !isEmptyFootnote(listItem)
          );

          if (filteredListChildren.length === 0) {
            return null;
          }

          return h(
            child.type as Component,
            { ...childProps, children: filteredListChildren },
            { default: () => filteredListChildren }
          );
        }

        return child;
      });

      if (!processedChildren.some((child) => child !== null && child !== undefined)) {
        return null;
      }

      return h(
        "section",
        {
          class: props.className,
          ...attrs,
        },
        processedChildren
      );
    };
  },
});

const extractCodeFromChildren = (children?: VNodeChild): string => {
  const childArray = getChildrenArray(children);

  if (childArray.length === 1 && typeof childArray[0] === "string") {
    return childArray[0];
  }

  const firstChild = childArray[0];
  if (isVNodeWithProps(firstChild) && typeof firstChild.children === "string") {
    return firstChild.children;
  }

  return "";
};

const MarkdownCode = defineComponent({
  name: "MarkdownCode",
  props: {
    children: { type: null, default: undefined },
    className: { type: String, default: undefined },
    node: { type: Object as PropType<MarkdownNode | undefined>, default: undefined },
    dataBlock: {
      type: String,
      default: undefined,
    },
  },
  setup(props, { attrs }) {
    const cn = useCn();
    const {
      mermaid: mermaidContext,
      controls: controlsConfig,
      lineNumbers: contextLineNumbers,
    } = useStreamdownContext();
    const mermaidPlugin = useMermaidPlugin();
    const plugins = usePlugins();
    const isBlockIncomplete = useIsCodeFenceIncomplete();

    return () => {
      const inline = !props.dataBlock && !("data-block" in attrs);
      const className = props.className ?? normalizeClass(attrs.class);
      const match = className?.match(LANGUAGE_REGEX);
      const language = match?.at(1) ?? "";
      const customRenderer = language && plugins?.renderers
        ? plugins.renderers.find((renderer) =>
            Array.isArray(renderer.language)
              ? renderer.language.includes(language)
              : renderer.language === language
          ) ?? null
        : null;

      if (inline) {
        const { class: _class, ...restAttrs } = attrs;
        return h(
          "code",
          {
            class: cn(
              "rounded bg-muted px-1.5 py-0.5 font-mono text-sm",
              className
            ),
            "data-streamdown": "inline-code",
            ...restAttrs,
          },
          getChildrenArray(props.children)
        );
      }

      const metastring =
        props.node?.properties?.metastring ??
        props.node?.properties?.metaString ??
        (typeof attrs.metastring === "string" ? attrs.metastring : undefined) ??
        (typeof attrs.metaString === "string" ? attrs.metaString : undefined);
      const startLineMatch = metastring?.match(START_LINE_PATTERN);
      const parsedStartLine = startLineMatch
        ? Number.parseInt(startLineMatch[1], 10)
        : undefined;
      const startLine =
        parsedStartLine !== undefined && parsedStartLine >= 1
          ? parsedStartLine
          : undefined;
      const metaNoLineNumbers = metastring
        ? NO_LINE_NUMBERS_PATTERN.test(metastring)
        : false;
      const showLineNumbers = !metaNoLineNumbers && contextLineNumbers !== false;
      const code = extractCodeFromChildren(props.children);

      if (customRenderer) {
        const CustomComponent = customRenderer.component;
        return h(
          CustomComponent,
          {
            code,
            isIncomplete: isBlockIncomplete,
            language,
            meta: metastring,
          },
          {}
        );
      }

      if (language === "mermaid" && mermaidPlugin) {
        const showMermaidControls = shouldShowControls(controlsConfig, "mermaid");
        const showDownload = shouldShowMermaidControl(controlsConfig, "download");
        const showCopy = shouldShowMermaidControl(controlsConfig, "copy");
        const showFullscreen = shouldShowMermaidControl(
          controlsConfig,
          "fullscreen"
        );
        const showPanZoomControls = shouldShowMermaidControl(
          controlsConfig,
          "panZoom"
        );
        const shouldShowMermaidControls =
          showMermaidControls && (showDownload || showCopy || showFullscreen);

        return h(
          "div",
          {
            class: cn(
              "group relative my-4 flex w-full flex-col gap-2 rounded-xl border border-border bg-sidebar p-2",
              className
            ),
            "data-streamdown": "mermaid-block",
          },
          [
            h(
              "div",
              {
                class: cn("flex h-8 items-center text-muted-foreground text-xs"),
              },
              [h("span", { class: cn("ml-1 font-mono lowercase") }, "mermaid")]
            ),
            shouldShowMermaidControls
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
                        "data-streamdown": "mermaid-block-actions",
                      },
                      [
                        showDownload
                          ? h(MermaidDownloadDropdown, {
                              chart: code,
                              config: mermaidContext?.config,
                            })
                          : null,
                        showCopy ? h(CodeBlockCopyButton, { code }) : null,
                        showFullscreen
                          ? h(MermaidFullscreenButton, {
                              chart: code,
                              config: mermaidContext?.config,
                            })
                          : null,
                      ]
                    ),
                  ]
                )
              : null,
            h(
              "div",
              { class: cn("rounded-md border border-border bg-background") },
              [
                h(Mermaid, {
                  chart: code,
                  config: mermaidContext?.config,
                  showControls: showPanZoomControls,
                }),
              ]
            ),
          ]
        );
      }

      const showCodeControls = shouldShowControls(controlsConfig, "code");
      const showDownload = shouldShowCodeControl(controlsConfig, "download");
      const showCopy = shouldShowCodeControl(controlsConfig, "copy");

      return h(
        CodeBlock,
        {
          class: className,
          code,
          isIncomplete: isBlockIncomplete,
          language,
          lineNumbers: showLineNumbers,
          startLine,
        },
        {
          default: () =>
            showCodeControls
              ? [
                  showDownload
                    ? h(CodeBlockDownloadButton, { code, language })
                    : null,
                  showCopy ? h(CodeBlockCopyButton) : null,
                ]
              : [],
        }
      );
    };
  },
});

const MarkdownImg = defineComponent({
  name: "MarkdownImg",
  props: {
    children: { type: null, default: undefined },
    className: { type: String, default: undefined },
    node: { type: Object as PropType<MarkdownNode | undefined>, default: undefined },
    src: { type: String, default: undefined },
    alt: { type: String, default: undefined },
  },
  setup(props, { attrs }) {
    return () =>
      h(ImageComponent, {
        node: props.node,
        class: props.className,
        src: props.src,
        alt: props.alt,
        ...attrs,
      });
  },
});

const MarkdownParagraph = defineComponent({
  name: "MarkdownParagraph",
  props: {
    children: { type: null, default: undefined },
    node: { type: Object as PropType<MarkdownNode | undefined>, default: undefined },
  },
  setup(props, { attrs }) {
    return () => {
      const childArray = getChildrenArray(props.children);
      const validChildren = childArray.filter(
        (child) => child !== null && child !== undefined && child !== ""
      );

      if (validChildren.length === 1 && isVNodeWithProps(validChildren[0])) {
        const childNode = withNodeProps(validChildren[0]).node as MarkdownNode | undefined;
        const tagName = childNode?.tagName;

        if (tagName === "img") {
          return h(Fragment, null, childArray);
        }

        if (tagName === "code") {
          const childProps = withNodeProps(validChildren[0]);
          if ("data-block" in childProps || "dataBlock" in childProps) {
            return h(Fragment, null, childArray);
          }
        }
      }

      return h("p", { ...attrs }, childArray);
    };
  },
});

const MarkdownPre = defineComponent({
  name: "MarkdownPre",
  props: {
    children: { type: null, default: undefined },
  },
  setup(props) {
    return () => {
      const childArray = getChildrenArray(props.children);
      if (childArray.length === 1 && isVNodeWithProps(childArray[0])) {
        const child = childArray[0];
        const childProps = withNodeProps(child);
        const children = getChildrenArray(child.children as VNodeChild);
        return h(
          child.type as Component,
          {
            ...childProps,
            "data-block": "true",
            dataBlock: "true",
          },
          typeof child.type === "string" ? children : { default: () => children }
        );
      }
      return h(Fragment, null, childArray);
    };
  },
});

export const components: Options["components"] = {
  ol: MarkdownOl,
  li: MarkdownLi,
  ul: MarkdownUl,
  hr: MarkdownHr,
  strong: MarkdownStrong,
  a: MarkdownA,
  h1: MarkdownH1,
  h2: MarkdownH2,
  h3: MarkdownH3,
  h4: MarkdownH4,
  h5: MarkdownH5,
  h6: MarkdownH6,
  table: MarkdownTable,
  thead: MarkdownThead,
  tbody: MarkdownTbody,
  tr: MarkdownTr,
  th: MarkdownTh,
  td: MarkdownTd,
  blockquote: MarkdownBlockquote,
  code: MarkdownCode,
  img: MarkdownImg,
  pre: MarkdownPre,
  sup: MarkdownSup,
  sub: MarkdownSub,
  p: MarkdownParagraph,
  section: MarkdownSection,
};

export const __internal = {
  sameClassAndNode,
  sameNodePosition,
  shouldShowControls,
  shouldShowTableControl,
  shouldShowCodeControl,
  shouldShowMermaidControl,
};
