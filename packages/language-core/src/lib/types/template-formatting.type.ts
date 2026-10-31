import type { Span } from '@xaendar/compiler';

/**
 * The change formatting a template makes.
 */
export type TemplateFormatting = {
  /**
   * The span of the template the formatted text replaces: the whole of it.
   */
  readonly span: Span;
  /**
   * The formatted template.
   */
  readonly newText: string;
};
