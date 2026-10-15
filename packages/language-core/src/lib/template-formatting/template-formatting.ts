import { formatTemplate, type Span, type TemplateFormatOptions } from '@xaendar/compiler';

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

/**
 * Computes how to format a template: its elements and control-flow blocks indented, the opening tags that don't fit the
 * line written one item per line, the interpolations of the properties written `{expression}` and those of the text
 * `{ expression }`, its `@import` statements in a regular form. What the template renders is not changed (see
 * `formatTemplate`). It works while the template doesn't compile, as long as its tags and blocks are closed.
 *
 * @param source - The current source of the template.
 * @param options - How to format it.
 * @returns The change, `undefined` if the template is already formatted or its layout cannot be read.
 */
export function getTemplateFormatting(source: string, options: TemplateFormatOptions): TemplateFormatting | undefined {
  const formatted = formatTemplate(source, options);
  return formatted === undefined || formatted === source ? undefined : { span: { start: 0, end: source.length }, newText: formatted };
}
