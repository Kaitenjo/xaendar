/**
 * The part a `@defer` block shows: its `@placeholder` before a trigger fires, its `@loading` while the modules of its
 * content load, its content once they are loaded (`complete`), or its `@error` when they fail to load.
 */
export type DeferBlockState = 'placeholder' | 'loading' | 'complete' | 'error';
