import { type InjectionKey, inject } from "vue";

/**
 * Context that indicates whether the current block has an incomplete code fence.
 * True when: streaming is active AND this is the last block AND it has an unclosed code fence.
 */
const BlockIncompleteKey: InjectionKey<boolean> = Symbol("BlockIncomplete");

/**
 * Hook to check if the current block has an incomplete (unclosed) code fence.
 *
 * Returns `true` when the code fence in this block is still being streamed.
 * Useful for deferring expensive renders (syntax highlighting, Mermaid diagrams)
 * until the code block is complete.
 */
export const useIsCodeFenceIncomplete = (): boolean => {
  return inject(BlockIncompleteKey, false);
};

export { BlockIncompleteKey };
