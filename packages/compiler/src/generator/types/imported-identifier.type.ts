import type { IdentifierKind } from './identifier-kind.type';

/**
 * A name a template imports from a module (see `SymbolImport`), as an expression reads it.
 */
export type ImportedIdentifier = {
  /**
   * The expression replacing the name: the alias the module is imported as in the generated code.
   */
  expression: string;
  /**
   * Whether reading the name can read a signal.
   */
  kind: IdentifierKind;
  /**
   * Whether an expression has read the name, i.e. whether the generated code must import it.
   */
  used: boolean;
};
