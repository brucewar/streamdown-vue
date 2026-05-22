import { type InjectionKey, defineComponent, inject, provide, type PropType, type VNodeChild } from "vue";
import type { ControlsConfig, LinkSafetyConfig, MermaidOptions } from "../index";
import type { ThemeInput } from "./plugin-types";

export interface StreamdownContextType {
  controls: ControlsConfig;
  isAnimating: boolean;
  lineNumbers: boolean;
  linkSafety?: LinkSafetyConfig;
  mermaid?: MermaidOptions;
  mode: "static" | "streaming";
  shikiTheme: [ThemeInput, ThemeInput];
}

export const defaultStreamdownContext: StreamdownContextType = {
  shikiTheme: ["github-light", "github-dark"],
  controls: true,
  isAnimating: false,
  lineNumbers: true,
  mode: "streaming",
  mermaid: undefined,
  linkSafety: { enabled: true },
};

export const StreamdownKey: InjectionKey<StreamdownContextType> =
  Symbol("Streamdown");

export const StreamdownContext = {
  Provider: defineComponent({
    name: "StreamdownContextProvider",
    props: {
      value: { type: Object as PropType<StreamdownContextType>, required: true },
    },
    setup(props, { slots }) {
      provide(StreamdownKey, props.value);
      return () => slots.default?.() as VNodeChild;
    },
  }),
};

export const useStreamdownContext = (): StreamdownContextType =>
  inject(StreamdownKey, defaultStreamdownContext);
