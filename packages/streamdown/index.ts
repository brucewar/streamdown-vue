import type { MermaidConfig } from "mermaid";
import {
  computed,
  defineComponent,
  h,
  isVNode,
  nextTick,
  provide,
  reactive,
  ref,
  watch,
  watchEffect,
  type Component,
  type CSSProperties,
  type PropType,
  type VNodeChild,
} from "vue";
import { harden } from "rehype-harden";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remend, { type RemendOptions } from "remend";
import type { Pluggable } from "unified";
import {
  type AnimateOptions,
  type AnimatePlugin,
  createAnimatePlugin,
} from "./lib/animate";
import { BlockIncompleteKey } from "./lib/block-incomplete-context";
import { components as defaultComponents } from "./lib/components";
import { detectTextDirection } from "./lib/detect-direction";
import { defaultIcons, IconKey, type IconMap } from "./lib/icon-context";
import { hasIncompleteCodeFence, hasTable } from "./lib/incomplete-code-utils";
import { Markdown, type Options } from "./lib/markdown";
import { parseMarkdownIntoBlocks } from "./lib/parse-blocks";
import { PluginKey } from "./lib/plugin-context";
import type { PluginConfig, ThemeInput } from "./lib/plugin-types";
import { PrefixKey } from "./lib/prefix-context";
import { preprocessCustomTags } from "./lib/preprocess-custom-tags";
import { preprocessLiteralTagContent } from "./lib/preprocess-literal-tag-content";
import { rehypeLiteralTagContent } from "./lib/rehype/literal-tag-content";
import { remarkCodeMeta } from "./lib/remark/code-meta";
import {
  defaultTranslations,
  enTranslations,
  localeTranslations,
  type StreamdownLocale,
  type StreamdownTranslations,
  TranslationsKey,
  zhCnTranslations,
} from "./lib/translations-context";
import {
  defaultStreamdownContext,
  StreamdownKey,
  type StreamdownContextType,
} from "./lib/streamdown-context";
import { createCn } from "./lib/utils";

export type {
  BundledLanguage,
  BundledTheme,
  ThemeRegistrationAny,
} from "shiki";
export type { AnimateOptions } from "./lib/animate";
export { createAnimatePlugin } from "./lib/animate";
export { useIsCodeFenceIncomplete } from "./lib/block-incomplete-context";
export { CodeBlock } from "./lib/code-block";
export { CodeBlockContainer } from "./lib/code-block/container";
export { CodeBlockCopyButton } from "./lib/code-block/copy-button";
export { CodeBlockDownloadButton } from "./lib/code-block/download-button";
export { CodeBlockHeader } from "./lib/code-block/header";
export { CodeBlockSkeleton } from "./lib/code-block/skeleton";
export { detectTextDirection } from "./lib/detect-direction";
export type { IconMap } from "./lib/icon-context";
export type {
  AllowElement,
  Components,
  ExtraProps,
  UrlTransform,
} from "./lib/markdown";
export { defaultUrlTransform } from "./lib/markdown";
export { parseMarkdownIntoBlocks } from "./lib/parse-blocks";
export type {
  CjkPlugin,
  CodeHighlighterPlugin,
  CustomRenderer,
  CustomRendererProps,
  DiagramPlugin,
  HighlightOptions,
  MathPlugin,
  PluginConfig,
  ThemeInput,
} from "./lib/plugin-types";
export {
  TableCopyDropdown,
  type TableCopyDropdownProps,
} from "./lib/table/copy-dropdown";
export {
  TableDownloadButton,
  type TableDownloadButtonProps,
  TableDownloadDropdown,
  type TableDownloadDropdownProps,
} from "./lib/table/download-dropdown";
export {
  escapeMarkdownTableCell,
  extractTableDataFromElement,
  type TableData,
  tableDataToCSV,
  tableDataToMarkdown,
  tableDataToTSV,
} from "./lib/table/utils";
export type {
  StreamdownLocale,
  StreamdownTranslations,
} from "./lib/translations-context";
export {
  defaultTranslations,
  enTranslations,
  localeTranslations,
  zhCnTranslations,
} from "./lib/translations-context";
export type { StreamdownContextType } from "./lib/streamdown-context";
export {
  StreamdownContext,
  StreamdownKey,
  useStreamdownContext,
} from "./lib/streamdown-context";

const HTML_BLOCK_START_PATTERN = /^[ \t]*<[\w!/?-]/;
const HTML_LINE_INDENT_PATTERN = /(^|\n)[ \t]{4,}(?=<[\w!/?-])/g;

export const normalizeHtmlIndentation = (content: string): string => {
  if (typeof content !== "string" || content.length === 0) {
    return content;
  }
  if (!HTML_BLOCK_START_PATTERN.test(content)) {
    return content;
  }
  return content.replace(HTML_LINE_INDENT_PATTERN, "$1");
};

export type ControlsConfig =
  | boolean
  | {
      table?:
        | boolean
        | {
            copy?: boolean;
            download?: boolean;
            fullscreen?: boolean;
          };
      code?:
        | boolean
        | {
            copy?: boolean;
            download?: boolean;
          };
      mermaid?:
        | boolean
        | {
            download?: boolean;
            copy?: boolean;
            fullscreen?: boolean;
            panZoom?: boolean;
          };
    };

export interface LinkSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  url: string;
}

export interface LinkSafetyConfig {
  enabled: boolean;
  onLinkCheck?: (url: string) => Promise<boolean> | boolean;
  renderModal?: (props: LinkSafetyModalProps) => unknown;
}

export interface MermaidErrorComponentProps {
  chart: string;
  error: string;
  retry: () => void;
}

export interface MermaidOptions {
  config?: MermaidConfig;
  errorComponent?: Component<MermaidErrorComponentProps>;
}

export type AllowedTags = Record<string, string[]>;

const carets = {
  block: " ▋",
  circle: " ●",
} as const;

const defaultShikiTheme: [ThemeInput, ThemeInput] = [
  "github-light",
  "github-dark",
];

const defaultLinkSafetyConfig: LinkSafetyConfig = {
  enabled: true,
};

export type StreamdownProps = Options & {
  mode?: "static" | "streaming";
  dir?: "auto" | "ltr" | "rtl";
  BlockComponent?: Component<BlockProps>;
  parseMarkdownIntoBlocksFn?: (markdown: string) => string[];
  parseIncompleteMarkdown?: boolean;
  normalizeHtmlIndentation?: boolean;
  className?: string;
  shikiTheme?: [ThemeInput, ThemeInput];
  mermaid?: MermaidOptions;
  controls?: ControlsConfig;
  locale?: StreamdownLocale;
  isAnimating?: boolean;
  animated?: boolean | AnimateOptions;
  caret?: keyof typeof carets;
  plugins?: PluginConfig;
  remend?: RemendOptions;
  linkSafety?: LinkSafetyConfig;
  allowedTags?: AllowedTags;
  literalTagContent?: string[];
  translations?: Partial<StreamdownTranslations>;
  icons?: Partial<IconMap>;
  prefix?: string;
  lineNumbers?: boolean;
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
};

const defaultSanitizeSchema = {
  ...defaultSchema,
  protocols: {
    ...defaultSchema.protocols,
    href: [...(defaultSchema.protocols?.href ?? []), "tel"],
  },
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), "metastring"],
  },
};

export const defaultRehypePlugins: Record<string, Pluggable> = {
  raw: rehypeRaw,
  sanitize: [rehypeSanitize, defaultSanitizeSchema],
  harden: [
    harden,
    {
      allowedImagePrefixes: ["*"],
      allowedLinkPrefixes: ["*"],
      allowedProtocols: ["*"],
      defaultOrigin: undefined,
      allowDataImages: true,
    },
  ],
} as const;

export const defaultRemarkPlugins: Record<string, Pluggable> = {
  gfm: [remarkGfm, {}],
  codeMeta: remarkCodeMeta,
} as const;

const defaultRehypePluginsArray = Object.values(defaultRehypePlugins);
const defaultRemarkPluginsArray = Object.values(defaultRemarkPlugins);

export type BlockProps = Options & {
  content: string;
  shouldParseIncompleteMarkdown: boolean;
  shouldNormalizeHtmlIndentation: boolean;
  index: number;
  isIncomplete: boolean;
  dir?: "ltr" | "rtl";
  animatePlugin?: AnimatePlugin | null;
};

export const Block = defineComponent({
  name: "Block",
  props: {
    content: {
      type: String,
      required: true,
    },
    shouldParseIncompleteMarkdown: {
      type: Boolean,
      required: true,
    },
    shouldNormalizeHtmlIndentation: {
      type: Boolean,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
    isIncomplete: {
      type: Boolean,
      required: true,
    },
    dir: {
      type: String as PropType<"ltr" | "rtl" | undefined>,
      default: undefined,
    },
    animatePlugin: {
      type: Object as PropType<AnimatePlugin | null>,
      default: null,
    },
    allowElement: {
      type: Function as PropType<Options["allowElement"]>,
      default: undefined,
    },
    allowedElements: {
      type: Array as PropType<Options["allowedElements"]>,
      default: undefined,
    },
    components: {
      type: Object as PropType<Options["components"]>,
      default: undefined,
    },
    disallowedElements: {
      type: Array as PropType<Options["disallowedElements"]>,
      default: undefined,
    },
    rehypePlugins: {
      type: Array as PropType<Options["rehypePlugins"]>,
      default: undefined,
    },
    remarkPlugins: {
      type: Array as PropType<Options["remarkPlugins"]>,
      default: undefined,
    },
    remarkRehypeOptions: {
      type: Object as PropType<Options["remarkRehypeOptions"]>,
      default: undefined,
    },
    skipHtml: {
      type: Boolean,
      default: undefined,
    },
    unwrapDisallowed: {
      type: Boolean,
      default: undefined,
    },
    urlTransform: {
      type: Function as PropType<Options["urlTransform"]>,
      default: undefined,
    },
  },
  setup(props) {
    provide(BlockIncompleteKey, props.isIncomplete);

    return () => {
      if (props.animatePlugin) {
        const prevCount = props.animatePlugin.getLastRenderCharCount();
        props.animatePlugin.setPrevContentLength(prevCount);
      }

      const normalizedContent =
        typeof props.content === "string" && props.shouldNormalizeHtmlIndentation
          ? normalizeHtmlIndentation(props.content)
          : props.content;

      const markdownProps: Options = {
        allowElement: props.allowElement,
        allowedElements: props.allowedElements,
        components: props.components,
        disallowedElements: props.disallowedElements,
        rehypePlugins: props.rehypePlugins,
        remarkPlugins: props.remarkPlugins,
        remarkRehypeOptions: props.remarkRehypeOptions,
        skipHtml: props.skipHtml,
        unwrapDisallowed: props.unwrapDisallowed,
        urlTransform: props.urlTransform,
        children: normalizedContent,
      };

      const markdownNode = h(Markdown, markdownProps);

      if (props.dir) {
        return h(
          "div",
          {
            dir: props.dir,
            style: { display: "contents" },
          },
          [markdownNode]
        );
      }

      return markdownNode;
    };
  },
});

const mergeIcons = (overrides?: Partial<IconMap>): IconMap => ({
  ...defaultIcons,
  ...overrides,
});

const slotChildrenToString = (children: VNodeChild): string => {
  if (children === null || children === undefined || typeof children === "boolean") {
    return "";
  }
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(slotChildrenToString).join("");
  }
  if (isVNode(children)) {
    return slotChildrenToString(children.children as VNodeChild);
  }
  return "";
};

const mergeComponents = (components?: Options["components"]): Options["components"] => {
  const { inlineCode, ...userComponents } = components ?? {};
  const merged: NonNullable<Options["components"]> = {
    ...defaultComponents,
    ...userComponents,
  };

  if (inlineCode) {
    const blockCode = merged.code;
    merged.code = ((props: Record<string, unknown>) => {
      const isInline = !("data-block" in props);
      if (isInline) {
        return h(inlineCode, props);
      }
      return blockCode ? h(blockCode, props) : null;
    }) as Component;
  }

  return merged;
};

export const Streamdown = defineComponent({
  name: "Streamdown",
  props: {
    allowElement: {
      type: Function as PropType<Options["allowElement"]>,
      default: undefined,
    },
    allowedElements: {
      type: Array as PropType<Options["allowedElements"]>,
      default: undefined,
    },
    children: {
      type: String,
      default: "",
    },
    components: {
      type: Object as PropType<Options["components"]>,
      default: undefined,
    },
    disallowedElements: {
      type: Array as PropType<Options["disallowedElements"]>,
      default: undefined,
    },
    rehypePlugins: {
      type: Array as PropType<Options["rehypePlugins"]>,
      default: () => defaultRehypePluginsArray,
    },
    remarkPlugins: {
      type: Array as PropType<Options["remarkPlugins"]>,
      default: () => defaultRemarkPluginsArray,
    },
    remarkRehypeOptions: {
      type: Object as PropType<Options["remarkRehypeOptions"]>,
      default: undefined,
    },
    skipHtml: {
      type: Boolean,
      default: undefined,
    },
    unwrapDisallowed: {
      type: Boolean,
      default: undefined,
    },
    urlTransform: {
      type: Function as PropType<Options["urlTransform"]>,
      default: undefined,
    },
    mode: {
      type: String as PropType<"static" | "streaming">,
      default: "streaming",
    },
    dir: {
      type: String as PropType<"auto" | "ltr" | "rtl" | undefined>,
      default: undefined,
    },
    BlockComponent: {
      type: [Object, Function] as PropType<Component<BlockProps>>,
      default: Block,
    },
    parseMarkdownIntoBlocksFn: {
      type: Function as PropType<(markdown: string) => string[]>,
      default: parseMarkdownIntoBlocks,
    },
    parseIncompleteMarkdown: {
      type: Boolean,
      default: true,
    },
    normalizeHtmlIndentation: {
      type: Boolean,
      default: false,
    },
    className: {
      type: String,
      default: undefined,
    },
    shikiTheme: {
      type: Array as unknown as PropType<[ThemeInput, ThemeInput]>,
      default: (): [ThemeInput, ThemeInput] => [...defaultShikiTheme],
    },
    mermaid: {
      type: Object as PropType<MermaidOptions | undefined>,
      default: undefined,
    },
    controls: {
      type: [Boolean, Object] as PropType<ControlsConfig>,
      default: true,
    },
    locale: {
      type: String as PropType<StreamdownLocale | undefined>,
      default: undefined,
    },
    isAnimating: {
      type: Boolean,
      default: false,
    },
    animated: {
      type: [Boolean, Object] as PropType<boolean | AnimateOptions | undefined>,
      default: undefined,
    },
    caret: {
      type: String as PropType<keyof typeof carets | undefined>,
      default: undefined,
    },
    plugins: {
      type: Object as PropType<PluginConfig | undefined>,
      default: undefined,
    },
    remend: {
      type: Object as PropType<RemendOptions | undefined>,
      default: undefined,
    },
    linkSafety: {
      type: Object as PropType<LinkSafetyConfig>,
      default: () => defaultLinkSafetyConfig,
    },
    allowedTags: {
      type: Object as PropType<AllowedTags | undefined>,
      default: undefined,
    },
    literalTagContent: {
      type: Array as PropType<string[] | undefined>,
      default: undefined,
    },
    translations: {
      type: Object as PropType<Partial<StreamdownTranslations> | undefined>,
      default: undefined,
    },
    icons: {
      type: Object as PropType<Partial<IconMap> | undefined>,
      default: undefined,
    },
    prefix: {
      type: String,
      default: undefined,
    },
    lineNumbers: {
      type: Boolean,
      default: true,
    },
    onAnimationStart: {
      type: Function as PropType<() => void>,
      default: undefined,
    },
    onAnimationEnd: {
      type: Function as PropType<() => void>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const generatedId = `sd-${Math.random().toString(36).slice(2, 10)}`;
    const prefixedCn = computed(() => createCn(props.prefix));
    const prevIsAnimating = ref<boolean | null>(null);
    const displayBlocks = ref<string[]>([]);

    const mergedIcons = computed(() => mergeIcons(props.icons));
    const localeValue = computed<StreamdownLocale>(() =>
      props.locale && props.locale in localeTranslations ? props.locale : "en"
    );
    const contextValue = computed<StreamdownContextType>(() => ({
      ...defaultStreamdownContext,
      shikiTheme: props.plugins?.code?.getThemes() ?? props.shikiTheme,
      controls: props.controls,
      isAnimating: props.isAnimating,
      lineNumbers: props.lineNumbers,
      mode: props.mode,
      mermaid: props.mermaid,
      linkSafety: props.linkSafety,
    }));
    const translationsValue = computed<StreamdownTranslations>(() => ({
      ...localeTranslations[localeValue.value],
      ...props.translations,
    }));

    const providedTranslations = reactive({ ...translationsValue.value });
    const providedStreamdownContext = reactive({ ...contextValue.value });
    const providedIcons = reactive({ ...mergedIcons.value });
    const providedPlugins = ref<PluginConfig | null>(props.plugins ?? null);
    const providedCn = ref(prefixedCn.value);

    provide(TranslationsKey, providedTranslations as StreamdownTranslations);
    provide(PluginKey, providedPlugins.value);
    provide(StreamdownKey, providedStreamdownContext as StreamdownContextType);
    provide(IconKey, providedIcons as IconMap);
    provide(PrefixKey, ((...args) => providedCn.value(...args)) as typeof prefixedCn.value);

    watchEffect(() => {
      Object.assign(providedTranslations, translationsValue.value);
      Object.assign(providedStreamdownContext, contextValue.value);
      Object.assign(providedIcons, mergedIcons.value);
      providedPlugins.value = props.plugins ?? null;
      providedCn.value = prefixedCn.value;
    });

    watch(
      () => props.isAnimating,
      (isAnimating) => {
        if (props.mode === "static") {
          return;
        }

        const prev = prevIsAnimating.value;
        prevIsAnimating.value = isAnimating;

        if (prev === null) {
          if (isAnimating) {
            props.onAnimationStart?.();
          }
          return;
        }

        if (isAnimating && !prev) {
          props.onAnimationStart?.();
        } else if (!isAnimating && prev) {
          props.onAnimationEnd?.();
        }
      },
      { immediate: true }
    );

    const allowedTagNames = computed(() =>
      props.allowedTags ? Object.keys(props.allowedTags) : []
    );

    const processedChildren = computed(() => {
      const slotContent = slots.default?.();
      const source = typeof props.children === "string" && props.children.length > 0
        ? props.children
        : slotChildrenToString(slotContent as VNodeChild);
      let result =
        props.mode === "streaming" && props.parseIncompleteMarkdown
          ? remend(source, props.remend)
          : source;

      if (props.literalTagContent?.length) {
        result = preprocessLiteralTagContent(result, props.literalTagContent);
      }

      if (allowedTagNames.value.length > 0) {
        result = preprocessCustomTags(result, allowedTagNames.value);
      }

      return result;
    });

    const blocks = computed(() =>
      props.parseMarkdownIntoBlocksFn(processedChildren.value)
    );

    watch(
      blocks,
      (value) => {
        displayBlocks.value = value;
      },
      { immediate: true }
    );

    const blocksToRender = computed(() =>
      props.mode === "streaming" ? displayBlocks.value : blocks.value
    );

    const blockDirections = computed(() =>
      props.dir === "auto"
        ? blocksToRender.value.map(detectTextDirection)
        : undefined
    );

    const blockKeys = computed(() =>
      blocksToRender.value.map((_block, idx) => `${generatedId}-${idx}`)
    );

    const animatedKey = computed(() => {
      if (props.animated === true) return "true";
      if (props.animated) return JSON.stringify(props.animated);
      return "";
    });

    const animatePlugin = computed<AnimatePlugin | null>(() => {
      if (!animatedKey.value) return null;
      if (animatedKey.value === "true") return createAnimatePlugin();
      return createAnimatePlugin(props.animated as AnimateOptions);
    });

    const mergedComponents = computed(() => mergeComponents(props.components));

    const mergedRemarkPlugins = computed<Pluggable[]>(() => {
      let result: Pluggable[] = [];
      if (props.plugins?.cjk) {
        result = [...result, ...props.plugins.cjk.remarkPluginsBefore];
      }
      result = [...result, ...(props.remarkPlugins ?? defaultRemarkPluginsArray)];
      if (props.plugins?.cjk) {
        result = [...result, ...props.plugins.cjk.remarkPluginsAfter];
      }
      if (props.plugins?.math) {
        result = [...result, props.plugins.math.remarkPlugin];
      }
      return result;
    });

    const mergedRehypePlugins = computed<Pluggable[]>(() => {
      let result = [...(props.rehypePlugins ?? defaultRehypePluginsArray)] as Pluggable[];

      if (
        props.allowedTags &&
        Object.keys(props.allowedTags).length > 0 &&
        (props.rehypePlugins ?? defaultRehypePluginsArray) === defaultRehypePluginsArray
      ) {
        const extendedSchema = {
          ...defaultSanitizeSchema,
          tagNames: [
            ...(defaultSanitizeSchema.tagNames ?? []),
            ...Object.keys(props.allowedTags),
          ],
          attributes: {
            ...defaultSanitizeSchema.attributes,
            ...props.allowedTags,
          },
        };

        result = [
          defaultRehypePlugins.raw,
          [rehypeSanitize, extendedSchema],
          defaultRehypePlugins.harden,
        ] as Pluggable[];
      }

      if (props.literalTagContent?.length) {
        result = [...result, [rehypeLiteralTagContent, props.literalTagContent]];
      }

      if (props.plugins?.math) {
        result = [...result, props.plugins.math.rehypePlugin];
      }

      if (animatePlugin.value && props.isAnimating) {
        result = [...result, animatePlugin.value.rehypePlugin];
      }

      return result;
    });

    const shouldHideCaret = computed(() => {
      if (!props.isAnimating || blocksToRender.value.length === 0) {
        return false;
      }
      const lastBlock = blocksToRender.value.at(-1) as string;
      return hasIncompleteCodeFence(lastBlock) || hasTable(lastBlock);
    });

    const style = computed<CSSProperties | undefined>(() =>
      props.caret && props.isAnimating && !shouldHideCaret.value
        ? ({
            "--streamdown-caret": `"${carets[props.caret]}"`,
          } as CSSProperties)
        : undefined
    );

    return () => {
      const wrapperClass = prefixedCn.value(
        "space-y-4 whitespace-normal [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        props.mode === "streaming" && props.caret && !shouldHideCaret.value
          ? "[&>*:last-child]:after:inline [&>*:last-child]:after:align-baseline [&>*:last-child]:after:content-[var(--streamdown-caret)]"
          : null,
        props.className
      );

      if (props.mode === "static") {
        const markdownProps: Options = {
          allowElement: props.allowElement,
          allowedElements: props.allowedElements,
          components: mergedComponents.value,
          disallowedElements: props.disallowedElements,
          rehypePlugins: mergedRehypePlugins.value,
          remarkPlugins: mergedRemarkPlugins.value,
          remarkRehypeOptions: props.remarkRehypeOptions,
          skipHtml: props.skipHtml,
          unwrapDisallowed: props.unwrapDisallowed,
          urlTransform: props.urlTransform,
          children: processedChildren.value,
        };

        return h(
          "div",
          {
            class: prefixedCn.value(
              "space-y-4 whitespace-normal [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
              props.className
            ),
            dir:
              props.dir === "auto"
                ? detectTextDirection(processedChildren.value)
                : props.dir,
          },
          [h(Markdown, markdownProps)]
        );
      }

      return h(
        "div",
        {
          class: wrapperClass,
          style: style.value,
        },
        [
          blocksToRender.value.length === 0 && props.caret && props.isAnimating
            ? h("span")
            : null,
          ...blocksToRender.value.map((block, index) => {
            const isLastBlock = index === blocksToRender.value.length - 1;
            const isIncomplete =
              props.isAnimating && isLastBlock && hasIncompleteCodeFence(block);

            return h(props.BlockComponent ?? Block, {
              animatePlugin: animatePlugin.value,
              allowElement: props.allowElement,
              allowedElements: props.allowedElements,
              components: mergedComponents.value,
              content: block,
              dir:
                blockDirections.value?.[index] ??
                (props.dir !== "auto" ? props.dir : undefined),
              disallowedElements: props.disallowedElements,
              index,
              isIncomplete,
              key: blockKeys.value[index],
              rehypePlugins: mergedRehypePlugins.value,
              remarkPlugins: mergedRemarkPlugins.value,
              remarkRehypeOptions: props.remarkRehypeOptions,
              shouldNormalizeHtmlIndentation: props.normalizeHtmlIndentation,
              shouldParseIncompleteMarkdown: props.parseIncompleteMarkdown,
              skipHtml: props.skipHtml,
              unwrapDisallowed: props.unwrapDisallowed,
              urlTransform: props.urlTransform,
            });
          }),
        ]
      );
    };
  },
});
