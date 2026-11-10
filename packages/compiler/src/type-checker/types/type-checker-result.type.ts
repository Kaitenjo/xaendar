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
}
