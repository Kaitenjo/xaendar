import type { ImportSpecifier } from '../../parser/types/nodes/import-specifier.type';

/**
 * What an `@import` specifier that is neither a component nor a directive imports: any other export of a module (a
 * function, a constant, an enum, a class, a type, an interface), or the module itself for a namespace import.
 */
export type ImportedSymbol = {
  /**
   * Discriminant telling an imported symbol from the metadata of a component or of a directive.
   */
  type: 'symbol';
  /**
   * Absolute path of the file of the module, with forward slashes, e.g. `/src/utils/format.ts`.
   */
  modulePath: string;
  /**
   * Whether reading the symbol in a binding can read a signal: a module signal, a function reading one, or a
   * namespace, whose members are not analyzed. A binding reading it is updated when the signal changes.
   */
  reactive: boolean;
};

/**
 * An `@import` specifier of a template importing a symbol, together with what it imports.
 */
export type SymbolImport = ImportSpecifier & ImportedSymbol;
