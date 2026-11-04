import type { Span, ImportInsertion } from '@xaendar/compiler';
import type { CompletionEntry } from 'typescript';

/**
 * A completion proposed in a template.
 */
export type TemplateCompletion = Pick<CompletionEntry, 'name' | 'sortText'> & {
  /**
   * What the completion is: a kind of TypeScript, `event` for an event of a component or directive, `component` or
   * `directive` for the selector of an imported one, or the class of one that can be imported.
   */
  readonly kind: CompletionEntry['kind'] | 'event' | 'component' | 'directive';
  /**
   * A short text shown next to the completion, e.g. the selector of the component or directive it names.
   */
  readonly detail?: string;
  /**
   * The span of the template the completion replaces, `undefined` for the word at the offset.
   */
  readonly replacementSpan?: Span;
  /**
   * The changes to apply to the template together with the completion, e.g. the `@import` of the component it names.
   */
  readonly additionalEdits?: readonly ImportInsertion[];
  /**
   * The snippet inserted in place of the name, with the tab stops the cursor moves through (`$1`, `$2`…, `$0` last).
   */
  readonly snippet?: string;
  /**
   * Whether the completions are proposed again once the snippet is inserted, at its first tab stop.
   */
  readonly retrigger?: boolean;
};
