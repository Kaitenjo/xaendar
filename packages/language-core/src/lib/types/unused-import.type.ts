import type { Span } from '@xaendar/compiler';

/**
 * A symbol an `@import` statement of a template imports and the template never uses.
 */
export type UnusedImport = {
  /**
   * The span of the specifier in the template: `Name`, or `Name as Alias`.
   */
  readonly span: Span;
  /**
   * The name the symbol is known by in the template.
   */
  readonly name: string;
  /**
   * The key of the specifier, to remove it (see {@link removeTemplateImport}).
   */
  readonly key: string;
};
