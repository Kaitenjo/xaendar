import type { EventCheck } from './event-check.type';
import type { LineMapping } from './line-mapping.type';
import type { VariableCall } from './variable-call.type';

/**
 * The type-check code of a template, with what maps it back onto the template.
 */
export type TypeCheckResult = {
  /**
   * Typescript Shim Source
   */
  text: string;
  /**
   * Table to map Shim's rows to the original template rows
   */
  mappingTable: ReadonlyMap<number, readonly LineMapping[]>;
  /**
   * The variables of the template called in its expressions (`row()`), which read the values
   * of the variables, not signals: the error TypeScript reports on the call of one whose value is not a function is
   * described with them (see `describeVariableCall`). `undefined` when the template calls none.
   */
  variableCalls?: readonly VariableCall[];
  /**
   * The checks of the names of the events the elements do not declare (`(bubbling)` on a `<div>`): the error
   * TypeScript reports on one is a warning (see `findEventCheck`). `undefined` when the template binds none, or when
   * the `strictEvents` option is `false`.
   */
  eventChecks?: readonly EventCheck[];
}
