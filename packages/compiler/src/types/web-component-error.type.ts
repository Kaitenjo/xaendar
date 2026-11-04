import type { Span } from './span.type';

/**
 * A problem of a `@WebComponent` declaration, located in the file declaring it.
 */
export type WebComponentError = {
  /**
   * The description of the problem.
   */
  readonly message: string;
  /**
   * The span of the file the problem refers to.
   */
  readonly span: Span;
};
