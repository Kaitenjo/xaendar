import type { Span } from '@xaendar/compiler';

/**
 * What the editor shows when the cursor rests on a part of a template.
 */
export type TemplateHover = {
  /**
   * The text to show, in markdown: the signature in a code block, then the JSDoc.
   */
  readonly contents: string;
  /**
   * The span of the template the text refers to, e.g. the whole tag name of a component.
   */
  readonly span: Span;
};
