import type { ImportSpecifier } from '../parser/types/nodes/import-specifier.type';
import type { ImportedSymbol } from './imported-symbol.type';

/**
 * An `@import` specifier of a template importing a symbol, together with what it imports.
 */
export type SymbolImport = ImportSpecifier & ImportedSymbol;
