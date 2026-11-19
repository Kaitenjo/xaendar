import { resolveModule } from '@xaendar/language-core';
import { dirname } from 'node:path';
import { CompilerOptions, createSourceFile, forEachChild, ImportDeclaration, isCallExpression, isExportDeclaration, isImportDeclaration, isNamedImports, isStringLiteralLike, Node, ScriptTarget, SyntaxKind } from 'typescript';

/**
 * Finds the modules the code of a project reads something from: what it imports may be used in any way, so the module
 * must stay as it is. An import written for the effects of a module (`import './a'`) reads nothing, and neither does an
 * `import type`.
 *
 * @param fileNames - The paths of the files of the code.
 * @param readFile - Reads a file.
 * @param compilerOptions - Project compiler options, driving how the modules are resolved.
 * @returns The paths of the modules.
 */
export function findCodeImports(fileNames: readonly string[], readFile: (path: string) => string | undefined, compilerOptions: CompilerOptions): ReadonlySet<string> {
  const imported = new Set<string>();
  for (let i = 0; i < fileNames.length; i++) {
    const fileName = fileNames[i];
    const baseDir = dirname(fileName);
    const add = (specifier: string): void => {
      const resolved = resolveModule(baseDir, specifier, compilerOptions);
      if (resolved) {
        imported.add(resolved.fileName);
      }
    };

    const visit = (node: Node): void => {
      const specifier = getReadSpecifier(node);
      if (specifier) {
        add(specifier);
      }

      forEachChild(node, visit);
    };

    visit(createSourceFile(fileName, readFile(fileName) ?? '', ScriptTarget.Latest, true));
  }

  return imported;
}

/**
 * Finds the module a node reads something from.
 *
 * @param node - The node.
 * @returns The specifier of the module, `undefined` when the node reads none.
 */
function getReadSpecifier(node: Node): string | undefined {
  if (isImportDeclaration(node)) {
    return readsValue(node) ? literalText(node.moduleSpecifier) : undefined;
  }

  if (isExportDeclaration(node)) {
    return !node.isTypeOnly && node.moduleSpecifier ? literalText(node.moduleSpecifier) : undefined;
  }

  return isCallExpression(node) && node.expression.kind === SyntaxKind.ImportKeyword ? literalText(node.arguments[0]) : undefined;
}

/**
 * Tells whether an import declaration reads a value.
 *
 * @param declaration - The declaration.
 * @returns `true` when it imports a name that is not only a type.
 */
function readsValue({ importClause }: ImportDeclaration): boolean {
  if (!importClause || importClause.isTypeOnly) {
    return false;
  }

  const bindings = importClause.namedBindings;
  return !!importClause.name || !bindings || !isNamedImports(bindings) || bindings.elements.some(element => !element.isTypeOnly);
}

/**
 * Reads a string literal.
 *
 * @param node - The node.
 * @returns The text, `undefined` for any other node.
 */
function literalText(node: Node): string | undefined {
  return isStringLiteralLike(node) ? node.text : undefined;
}
