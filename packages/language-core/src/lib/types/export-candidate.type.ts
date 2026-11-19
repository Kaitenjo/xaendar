import type { ScriptElementKind } from 'typescript';

/**
 * An export of a module a template can import.
 */
export type ExportCandidate = {
  /**
   * The path of the file of the module.
   */
  readonly fileName: string;
  /**
   * The name the module exports it as, `default` for its default export.
   */
  readonly name: string;
  /**
   * What it declares (see `getSymbolKind`).
   */
  readonly kind: ScriptElementKind;
};
