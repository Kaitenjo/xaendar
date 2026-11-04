import type { Span } from '../../types/span.type';

/**
 * Where the selector of a component or directive is being written: the tag name after the `<` of an opening tag, or
 * the selector after the `@@` or the `*` of a directive.
 */
export type SelectorContext = {
  /**
   * Whether the selector is the one of a component (`<selector`) or of a directive (`@@selector`, `*selector`).
   */
  readonly kind: 'component' | 'directive';
  /**
   * The span of the part of the selector written so far, empty when nothing is written yet.
   */
  readonly span: Span;
};
