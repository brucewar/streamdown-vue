import type { Element, Nodes, Parents, Root } from "hast";
import { urlAttributes } from "html-url-attributes";
import { h, Fragment, type VNode, type Component } from "vue";
import rehypeRaw from "rehype-raw";
import remarkParse from "remark-parse";
import type { Options as RemarkRehypeOptions } from "remark-rehype";
import remarkRehype from "remark-rehype";
import type { PluggableList } from "unified";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { remarkEscapeHtml } from "./remark/escape-html";

export interface ExtraProps {
  node?: Element | undefined;
}

export type AllowElement = (
  element: Readonly<Element>,
  index: number,
  parent: Readonly<Parents> | undefined
) => boolean | null | undefined;

export type UrlTransform = (
  url: string,
  key: string,
  node: Readonly<Element>
) => string | null | undefined;

export type Components = {
  [key: string]: Component | string | undefined;
} & {
  inlineCode?: Component;
};

export interface Options {
  allowElement?: AllowElement;
  allowedElements?: readonly string[];
  children?: string;
  components?: Components;
  disallowedElements?: readonly string[];
  rehypePlugins?: PluggableList;
  remarkPlugins?: PluggableList;
  remarkRehypeOptions?: Readonly<RemarkRehypeOptions>;
  skipHtml?: boolean;
  unwrapDisallowed?: boolean;
  urlTransform?: UrlTransform;
}

// Stable references for common cases
const EMPTY_PLUGINS: PluggableList = [];
const DEFAULT_REMARK_REHYPE_OPTIONS = { allowDangerousHtml: true };

// LRU Cache for unified processors
class ProcessorCache {
  // biome-ignore lint/suspicious/noExplicitAny: Processor type is complex and varies with plugins
  private readonly cache = new Map<string, any>();
  private readonly keyCache = new WeakMap<Readonly<Options>, string>();
  private readonly maxSize = 100;

  generateCacheKey(options: Readonly<Options>): string {
    const cachedKey = this.keyCache.get(options);
    if (cachedKey) return cachedKey;

    const rehypePlugins = options.rehypePlugins;
    const remarkPlugins = options.remarkPlugins;
    const remarkRehypeOptions = options.remarkRehypeOptions;

    if (!(rehypePlugins || remarkPlugins || remarkRehypeOptions)) {
      const key = "default";
      this.keyCache.set(options, key);
      return key;
    }

    const serializePlugins = (plugins: PluggableList | undefined): string => {
      if (!plugins || plugins.length === 0) return "";
      let result = "";
      for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i];
        if (i > 0) result += ",";
        if (Array.isArray(plugin)) {
          const [pluginFn, pluginOptions] = plugin;
          result += typeof pluginFn === "function" ? pluginFn.name || String(pluginFn) : String(pluginFn);
          result += ":" + JSON.stringify(pluginOptions);
        } else if (typeof plugin === "function") {
          result += plugin.name || String(plugin);
        } else {
          result += String(plugin);
        }
      }
      return result;
    };

    const key = `${serializePlugins(remarkPlugins)}::${serializePlugins(rehypePlugins)}::${remarkRehypeOptions ? JSON.stringify(remarkRehypeOptions) : ""}`;
    this.keyCache.set(options, key);
    return key;
  }

  get(options: Readonly<Options>) {
    const key = this.generateCacheKey(options);
    const processor = this.cache.get(key);
    if (processor) {
      this.cache.delete(key);
      this.cache.set(key, processor);
    }
    return processor;
  }

  // biome-ignore lint/suspicious/noExplicitAny: Processor type is complex and varies with plugins
  set(options: Readonly<Options>, processor: any): void {
    const key = this.generateCacheKey(options);
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, processor);
  }
}

const processorCache = new ProcessorCache();

export const Markdown = (options: Readonly<Options>) => {
  const processor = getCachedProcessor(options);
  const content = options.children || "";
  // biome-ignore lint/suspicious/noExplicitAny: runSync return type varies with processor configuration
  const tree = processor.runSync(processor.parse(content), content) as any;
  return post(tree, options);
};

const getCachedProcessor = (options: Readonly<Options>) => {
  const cached = processorCache.get(options);
  if (cached) return cached;
  const processor = createProcessor(options);
  processorCache.set(options, processor);
  return processor;
};

const hasRehypeRaw = (plugins: PluggableList): boolean =>
  plugins.some((plugin) =>
    Array.isArray(plugin) ? plugin[0] === rehypeRaw : plugin === rehypeRaw
  );

const createProcessor = (options: Readonly<Options>) => {
  const rehypePlugins = options.rehypePlugins || EMPTY_PLUGINS;
  const remarkPlugins = options.remarkPlugins || EMPTY_PLUGINS;

  const finalRemarkPlugins = hasRehypeRaw(rehypePlugins)
    ? remarkPlugins
    : [...remarkPlugins, remarkEscapeHtml];

  const remarkRehypeOptions = options.remarkRehypeOptions
    ? { ...DEFAULT_REMARK_REHYPE_OPTIONS, ...options.remarkRehypeOptions }
    : DEFAULT_REMARK_REHYPE_OPTIONS;

  return unified()
    .use(remarkParse)
    .use(finalRemarkPlugins)
    .use(remarkRehype, remarkRehypeOptions)
    .use(rehypePlugins);
};

export const defaultUrlTransform: UrlTransform = (value) => value;

const transformUrls = (node: Element, transform: UrlTransform): void => {
  for (const key in urlAttributes) {
    if (
      Object.hasOwn(urlAttributes, key) &&
      Object.hasOwn(node.properties, key)
    ) {
      const value = node.properties[key];
      const test = urlAttributes[key];
      if (test === null || test.includes(node.tagName)) {
        node.properties[key] =
          transform(String(value || ""), key, node) ?? undefined;
      }
    }
  }
};

const htmlAttributeName = (name: string): string => {
  if (name.startsWith("data") && name.length > 4) {
    return `data-${name.slice(4).replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`).replace(/^-/, "")}`;
  }
  if (name.startsWith("aria") && name.length > 4) {
    return `aria-${name.slice(4).replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`).replace(/^-/, "")}`;
  }
  return name;
};

const shouldRemoveElement = (
  node: Readonly<Element>,
  index: number | undefined,
  parent: Readonly<Parents> | undefined,
  allowedElements: readonly string[] | undefined,
  disallowedElements: readonly string[] | undefined,
  allowElement: AllowElement | undefined
): boolean => {
  let remove = false;

  if (allowedElements) {
    remove = !allowedElements.includes(node.tagName);
  } else if (disallowedElements) {
    remove = disallowedElements.includes(node.tagName);
  }

  if (!remove && allowElement && typeof index === "number") {
    remove = !allowElement(node, index, parent);
  }

  return remove;
};

function toVue(node: any, options: Readonly<Options>, key?: string | number): VNode | string | null {
  if (node.type === "text") {
    return node.value;
  }

  if (node.type === "root") {
    const children = (node.children || []).map((child: any, i: number) => toVue(child, options, i));
    return h(Fragment, null, children);
  }

  if (node.type === "element") {
    const { tagName, properties, children } = node;

    // Format properties for Vue (e.g. className -> class, style string/object formatting)
    const vueProps: Record<string, any> = {};
    if (properties) {
      for (const [propName, value] of Object.entries(properties)) {
        if (propName === 'className') {
          vueProps['class'] = Array.isArray(value) ? value.join(' ') : value;
        } else if (propName === 'htmlFor') {
          vueProps['for'] = value;
        } else {
          vueProps[htmlAttributeName(propName)] = value;
        }
      }
    }

    vueProps.key = key;

    const vueChildren = (children || []).map((child: any, i: number) => toVue(child, options, i));

    let componentOrTag: any = tagName;
    if (options.components && options.components[tagName]) {
      componentOrTag = options.components[tagName];
      vueProps.node = node;
      vueProps.children = vueChildren;
      return h(componentOrTag, vueProps, { default: () => vueChildren });
    }

    return h(componentOrTag, vueProps, vueChildren);
  }

  return null;
}

const post = (tree: Nodes, options: Readonly<Options>): VNode => {
  const {
    allowElement,
    allowedElements,
    disallowedElements,
    skipHtml,
    unwrapDisallowed,
    urlTransform,
  } = options;

  const hasFiltering =
    allowElement ||
    allowedElements ||
    disallowedElements ||
    skipHtml ||
    urlTransform;

  if (hasFiltering) {
    const transform = urlTransform || defaultUrlTransform;

    visit(tree as Root, (node, index, parent) => {
      if (node.type === "raw" && parent && typeof index === "number") {
        if (skipHtml) {
          parent.children.splice(index, 1);
        } else {
          parent.children[index] = { type: "text", value: node.value } as never;
        }
        return index;
      }

      if (node.type === "element") {
        transformUrls(node, transform);

        const remove = shouldRemoveElement(
          node,
          index,
          parent,
          allowedElements,
          disallowedElements,
          allowElement
        );

        if (remove && parent && typeof index === "number") {
          if (unwrapDisallowed && node.children) {
            parent.children.splice(index, 1, ...node.children);
          } else {
            parent.children.splice(index, 1);
          }
          return index;
        }
      }
    });
  }

  // Use the custom Vue AST renderer instead of hast-util-to-jsx-runtime
  const result = toVue(tree, options);

  // toVue returns a Fragment for the root node, which is a valid VNode
  return result as VNode;
};