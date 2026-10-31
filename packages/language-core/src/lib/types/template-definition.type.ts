import type { MemberDeclaration, Span } from '@xaendar/compiler';

/**
 * Where a symbol used in a template is defined: a span of a file, or of the template itself.
 */
export type TemplateDefinition = MemberDeclaration & {
  /**
   * The whole span the definition was requested from, when the part is longer than the word under the cursor,
   * e.g. a tag name with dashes or the path of an `@import`.
   */
  readonly origin?: Span;
};
