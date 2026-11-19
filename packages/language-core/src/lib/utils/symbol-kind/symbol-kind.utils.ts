import { ScriptElementKind, type Symbol, SymbolFlags, type TypeChecker } from 'typescript';

/**
 * The kind of completion of each kind of declaration, the first one a symbol declares winning.
 */
const KINDS: ReadonlyArray<readonly [SymbolFlags, ScriptElementKind]> = [
  [SymbolFlags.Class, ScriptElementKind.classElement],
  [SymbolFlags.Enum, ScriptElementKind.enumElement],
  [SymbolFlags.Interface, ScriptElementKind.interfaceElement],
  [SymbolFlags.TypeAlias, ScriptElementKind.typeElement],
  [SymbolFlags.Function, ScriptElementKind.functionElement],
  [SymbolFlags.BlockScopedVariable, ScriptElementKind.constElement],
  [SymbolFlags.Variable, ScriptElementKind.variableElement],
  [SymbolFlags.Module, ScriptElementKind.moduleElement]
];

/**
 * Tells what a symbol declares, as the kind of a TypeScript completion: an alias (an import, a re-export) is the
 * symbol it stands for.
 *
 * @param checker - The type checker of the program declaring the symbol.
 * @param symbol - The symbol.
 * @returns The kind, `ScriptElementKind.unknown` for a symbol declaring none of the known kinds.
 */
export function getSymbolKind(checker: TypeChecker, symbol: Symbol): ScriptElementKind {
  const { flags } = symbol.flags & SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  return KINDS.find(([flag]) => flags & flag)?.[1] ?? ScriptElementKind.unknown;
}
