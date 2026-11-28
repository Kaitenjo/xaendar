import type { Span } from '@xaendar/compiler';

/**
 * A part of a `@WebComponent` decorator leading to the files of its component.
 */
export type ComponentTarget = {
  /**
   * The span of the part in the component file.
   */
  readonly span: Span;
  /**
   * The urls, relative to the component file, of the files the part leads to.
   */
  readonly urls: ReadonlyArray<string | undefined>;
};
