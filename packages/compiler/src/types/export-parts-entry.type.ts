import type { Span } from './span.type';

/**
 * A part an `exportparts` forwards, `inner: outer` or `name` (see `parseExportParts`).
 */
export type ExportPartsEntry = {
  /**
   * The name of the part in the component holding the element, which it exposes: `inner` of `inner: outer`.
   */
  readonly inner: string;
  /**
   * The name the part is forwarded by, the same as {@link inner} when the entry does not rename it.
   */
  readonly outer: string;
  /**
   * The span of {@link inner} in the template.
   */
  readonly innerSpan: Span;
};
