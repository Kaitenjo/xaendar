import { ASTNodeType, type ComponentOrDirectiveMetadata, type ImportInsertion, type ImportNode, type ImportSpecifier, organizeImports, resolveShimPosition, type Span, type SymbolImport, toImportKey } from '@xaendar/compiler';
import type { TemplateAnalysis } from '../template-analysis/template-analysis';
import { walkTemplate } from '../utils/template-walker/template-walker.utils';

/**
 * A symbol an `@import` statement of a template imports and the template never uses.
 */
export type UnusedImport = {
  /**
   * The span of the specifier in the template: `Name`, or `Name as Alias`.
   */
  readonly span: Span;
  /**
   * The name the symbol is known by in the template.
   */
  readonly name: string;
  /**
   * The key of the specifier, to remove it (see {@link removeTemplateImport}).
   */
  readonly key: string;
};

/**
 * Finds the symbols a template imports and never uses:
 * - a component that no element of the template is, a directive that no directive or structural directive is;
 * - any other symbol that no expression and no type argument reads, i.e. its import declaration in the type-check code
 *   has no reference (see `typeCheckImport`).
 *
 * @param analysis - The analysis of the template.
 * @returns The unused imports, the components and directives first, each group in the order they are written in,
 *   `undefined` if the template uses all of them.
 */
export function findUnusedImports(analysis: Pick<TemplateAnalysis, 'ast' | 'imports' | 'metadatas' | 'symbols' | 'typeCheck' | 'bodyLineOffset' | 'shimPath' | 'languageService'>): UnusedImport[] | undefined {
  const { ast, imports, metadatas, symbols } = analysis;
  const used = new Set<ComponentOrDirectiveMetadata>();
  walkTemplate(ast, metadatas, {
    element: (_node, component) => {
      if (component) {
        used.add(component);
      }
    },
    directive: (_node, directive) => {
      if (directive) {
        used.add(directive);
      }
    }
  });

  let unused: UnusedImport[] | undefined;
  for (let i = 0; i < imports.length; i++) {
    const { node, specifier, metadata } = imports[i];
    if (!used.has(metadata)) {
      unused ??= new Array<UnusedImport>();
      unused.push(toUnusedImport(node.path, specifier));
    }
  }

  const importNodes = ast.filter((node): node is ImportNode => node.type === ASTNodeType.Import);
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    if (!isSymbolUsed(analysis, symbol)) {
      unused ??= new Array<UnusedImport>();
      unused.push(toUnusedImport(importNodes.find(({ specifiers }) => specifiers.some(({ importedSpan }) => importedSpan.start === symbol.importedSpan.start))!.path, symbol));
    }
  }

  return unused;
}

/**
 * Describes an unused specifier of an `@import`.
 *
 * @param path - The path of the module of the `@import`.
 * @param specifier - The specifier.
 * @returns The unused import.
 */
function toUnusedImport(path: string, { imported, local, importedSpan, localSpan }: ImportSpecifier): UnusedImport {
  return {
    span: { start: Math.min(importedSpan.start, localSpan.start), end: Math.max(importedSpan.end, localSpan.end) },
    name: local,
    key: toImportKey(path, imported === local ? imported : `${imported} as ${local}`)
  };
}

/**
 * Tells whether a template reads a symbol it imports: the declaration importing it in the type-check code (see
 * `typeCheckImport`) is referenced by the code checking an expression or a type argument.
 *
 * @param analysis - The analysis of the template.
 * @param symbol - The imported symbol.
 * @returns `true` if the symbol is read, or when the type-check code doesn't import it (e.g. under a reserved name, an error already).
 */
function isSymbolUsed({ typeCheck, bodyLineOffset, shimPath, languageService }: Pick<TemplateAnalysis, 'typeCheck' | 'bodyLineOffset' | 'shimPath' | 'languageService'>, { localSpan }: SymbolImport): boolean {
  const position = resolveShimPosition(typeCheck.mappingTable, localSpan.start);
  if (!position) {
    return true;
  }

  const shimFile = languageService.getProgram()!.getSourceFile(shimPath)!;
  const references = languageService.findReferences(shimPath, shimFile.getPositionOfLineAndCharacter(position.line + bodyLineOffset, position.character));
  return !!references?.some(({ references: entries }) => entries.some(({ isDefinition, fileName }) => !isDefinition && fileName === shimPath));
}

/**
 * Computes how to remove an unused import from a template, together with the statement it leaves empty.
 *
 * @param source - The current source of the template.
 * @param unused - The unused import.
 * @returns The span and the text to write there, `undefined` if the template doesn't import it.
 */
export function removeTemplateImport(source: string, { key }: UnusedImport): ImportInsertion | undefined {
  return organizeImports(source, { unused: new Set([key]) });
}

/**
 * Computes how to organize the imports of a template: the unused ones are removed, with the statements left empty, the
 * statements importing from the same module are merged, and the statements and their specifiers are sorted.
 *
 * Nothing is removed when the analysis is not the one of the current source (e.g. while the template cannot be compiled),
 * since what the template uses is not known then: the imports are only sorted.
 *
 * @param source - The current source of the template.
 * @param analysis - The last analysis of the template, if any.
 * @returns The span and the text to write there, `undefined` if the imports are already organized.
 */
export function organizeTemplateImports(source: string, analysis: TemplateAnalysis | undefined): ImportInsertion | undefined {
  const unused = analysis?.source === source ? findUnusedImports(analysis) : undefined;
  return organizeImports(source, { unused: unused && new Set(unused.map(({ key }) => key)), sort: true });
}
