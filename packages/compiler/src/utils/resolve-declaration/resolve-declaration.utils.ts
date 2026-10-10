import { readFileSync, statSync } from 'node:fs';
import { ClassDeclaration, CompilerOptions, Declaration, Expression, ImportDeclaration, ModuleKind, ModuleResolutionKind, ScriptTarget, SourceFile, SyntaxKind, createSourceFile, isClassDeclaration, isExportAssignment, isExportDeclaration, isIdentifier, isImportDeclaration, isNamedExports, isNamedImports, isNamespaceImport, isPropertyAccessExpression, isStringLiteralLike, resolveModuleName, sys } from 'typescript';
import type { CachedSourceFile } from './types/cached-source-file.type';
import type { DeclarationFinder } from './types/declaration-finder.type';
import type { ResolutionContext } from './types/resolution-context.type';
import type { ResolvedClass } from './types/resolved-class.type';
import type { ResolvedDeclaration } from './types/resolved-declaration.type';

/**
 * Module resolution used when the caller doesn't supply the project compiler
 * options: honours `package.json` "types"/"typings"/"exports" and extensionless
 * relative specifiers, like the bundlers Xaendar components are built with.
 */
export const DEFAULT_COMPILER_OPTIONS: CompilerOptions = {
  module: ModuleKind.ESNext,
  moduleResolution: ModuleResolutionKind.Bundler
};

/**
 * Finds the class declarations of a file: the base classes of a component.
 */
const CLASS_FINDER: DeclarationFinder<ClassDeclaration> = {
  local: (statement, localName) => isClassDeclaration(statement) && statement.name?.text === localName ? statement : undefined,
  exported: (statement, exportedName) => isClassDeclaration(statement) && isClassExportedAs(statement, exportedName) ? statement : undefined
};

/**
 * Parsed files declaring the resolved declarations, keyed by path. Components usually share the same
 * bases (at least `CustomElement`), so each file is parsed once and
 * reparsed only when its modification time or size changes.
 */
const sourceFileCache = new Map<string, CachedSourceFile>();

/**
 * Resolves the class a class directly extends, through imports, namespace imports and re-exports,
 * with a resolution state of its own.
 *
 * @param klass - The class whose base class is resolved, with the file declaring it.
 * @param compilerOptions - Project compiler options, driving how the module declaring the base class is resolved.
 * @returns The base class with the file declaring it, or `undefined` when the class extends nothing
 *   or its base class can't be resolved.
 */
export function resolveBaseClassOf(klass: ResolvedClass, compilerOptions = DEFAULT_COMPILER_OPTIONS): ResolvedClass | undefined {
  return resolveBaseClass(klass, { compilerOptions, dependencies: new Set(), visitedClasses: new Set() });
}

/**
 * Resolves the class `klass` directly extends, if any.
 *
 * @param klass - The class whose base class is resolved.
 * @param context - State of the current extraction.
 * @returns The base class with the file declaring it, or `undefined` when
 *   `klass` extends nothing or its base class can't be resolved.
 */
export function resolveBaseClass({ sourceFile, declaration }: ResolvedClass, context: ResolutionContext): ResolvedClass | undefined {
  const expression = getBaseClassExpression(declaration);
  if (!expression) {
    return;
  }

  return resolveReference(sourceFile, expression, CLASS_FINDER, context, new Set());
}

/**
 * Returns the expression of the `extends` clause of `declaration`.
 *
 * @param declaration - The class declaration to inspect.
 * @returns The extended expression, or `undefined` when the class extends nothing.
 */
function getBaseClassExpression(declaration: ClassDeclaration): Expression | undefined {
  const extendsClause = declaration.heritageClauses?.find(clause => clause.token === SyntaxKind.ExtendsKeyword);
  return extendsClause?.types[0].expression;
}

/**
 * Resolves the declaration an expression of `sourceFile` refers to: a local name
 * (`Base`, `count`) or a member of a namespace import (`ns.Base`, `store.count`).
 *
 * @param sourceFile - The file containing the expression.
 * @param expression - The expression referring to the declaration.
 * @param finder - Finds the declarations of the searched kind.
 * @param context - State of the current extraction.
 * @param visitedExports - Exports already visited while resolving the declaration,
 *   to stop on circular re-exports.
 * @returns The declaration with the file declaring it, or `undefined` if it can't be resolved.
 */
export function resolveReference<D extends Declaration>(sourceFile: SourceFile, expression: Expression, finder: DeclarationFinder<D>, context: ResolutionContext, visitedExports: Set<string>): ResolvedDeclaration<D> | undefined {
  // class Cmp extends Base {}
  if (isIdentifier(expression)) {
    return resolveLocal(sourceFile, expression.text, finder, context, visitedExports);
  }

  // import * as ns from './base'; class Cmp extends ns.Base {}
  if (isPropertyAccessExpression(expression) && isIdentifier(expression.expression)) {
    const importDeclaration = findNamespaceImport(sourceFile, expression.expression.text);
    if (importDeclaration) {
      return resolveImported(sourceFile, importDeclaration.moduleSpecifier, expression.name.text, finder, context, visitedExports);
    }
  }
}

/**
 * Resolves the declaration bound to `localName` in the scope of `sourceFile`:
 * either declared in the file itself, or imported into it.
 *
 * @param sourceFile - The file in whose scope `localName` is looked up.
 * @param localName - The local name the declaration is bound to.
 * @param finder - Finds the declarations of the searched kind.
 * @param context - State of the current extraction.
 * @param visitedExports - Exports already visited while resolving the declaration,
 *   to stop on circular re-exports.
 * @returns The declaration with the file declaring it, or `undefined` if it can't be resolved.
 */
function resolveLocal<D extends Declaration>(sourceFile: SourceFile, localName: string, finder: DeclarationFinder<D>, context: ResolutionContext, visitedExports: Set<string>): ResolvedDeclaration<D> | undefined {
  for (const statement of sourceFile.statements) {
    const declaration = finder.local(statement, localName);
    if (declaration) {
      return { sourceFile, declaration };
    }

    if (isImportDeclaration(statement)) {
      const importedName = getImportedName(statement, localName);
      if (importedName) {
        return resolveImported(sourceFile, statement.moduleSpecifier, importedName, finder, context, visitedExports);
      }
    }
  }
}

/**
 * Returns the name exported by the imported module under which `localName`
 * is imported by `importDeclaration`, if it's imported there at all.
 *
 * @param importDeclaration - The import declaration to inspect.
 * @param localName - The local name to look for among the imported bindings.
 * @returns The imported name (`'default'` for a default import), or `undefined`
 *   when `localName` isn't imported by `importDeclaration`.
 */
function getImportedName(importDeclaration: ImportDeclaration, localName: string): string | undefined {
  const importClause = importDeclaration.importClause;
  if (importClause?.name?.text === localName) {
    return 'default';
  }

  const namedBindings = importClause?.namedBindings;
  if (namedBindings && isNamedImports(namedBindings)) {
    const element = namedBindings.elements.find(el => el.name.text === localName);
    return element && (element.propertyName ?? element.name).text;
  }

  return;
}

/**
 * Finds the namespace import (`import * as namespace from '...'`) binding `namespace`.
 *
 * @param sourceFile - The file to search.
 * @param namespace - The local name of the namespace.
 * @returns The import declaration, or `undefined` if there's none.
 */
function findNamespaceImport(sourceFile: SourceFile, namespace: string): ImportDeclaration | undefined {
  return sourceFile.statements.find((statement): statement is ImportDeclaration => {
    const namedBindings = isImportDeclaration(statement) ? statement.importClause?.namedBindings : undefined;
    return !!namedBindings && isNamespaceImport(namedBindings) && namedBindings.name.text === namespace;
  });
}

/**
 * Resolves the declaration exported as `exportedName` by the module `moduleSpecifier`
 * refers to, when imported from `sourceFile`.
 *
 * @param sourceFile - The file importing the module.
 * @param moduleSpecifier - The module specifier of the import or re-export.
 * @param exportedName - The name the declaration is exported as.
 * @param finder - Finds the declarations of the searched kind.
 * @param context - State of the current extraction.
 * @param visitedExports - Exports already visited while resolving the declaration,
 *   to stop on circular re-exports.
 * @returns The declaration with the file declaring it, or `undefined` if it can't be resolved.
 */
function resolveImported<D extends Declaration>(sourceFile: SourceFile, moduleSpecifier: Expression, exportedName: string, finder: DeclarationFinder<D>, context: ResolutionContext, visitedExports: Set<string>): ResolvedDeclaration<D> | undefined {
  if (!isStringLiteralLike(moduleSpecifier)) {
    return;
  }

  const { resolvedModule } = resolveModuleName(moduleSpecifier.text, sourceFile.fileName, context.compilerOptions, sys);
  const moduleSourceFile = resolvedModule && getSourceFile(resolvedModule.resolvedFileName, context);
  return moduleSourceFile ? resolveExported(moduleSourceFile, exportedName, finder, context, visitedExports) : undefined;
}

/**
 * Resolves the declaration exported by `sourceFile` as `exportedName`, following
 * re-exports to the file actually declaring it.
 *
 * @param sourceFile - The module exporting the declaration.
 * @param exportedName - The name the declaration is exported as.
 * @param finder - Finds the declarations of the searched kind.
 * @param context - State of the current extraction.
 * @param visitedExports - Exports already visited while resolving the declaration,
 *   to stop on circular re-exports.
 * @returns The declaration with the file declaring it, or `undefined` if it can't be resolved.
 */
function resolveExported<D extends Declaration>(sourceFile: SourceFile, exportedName: string, finder: DeclarationFinder<D>, context: ResolutionContext, visitedExports: Set<string>): ResolvedDeclaration<D> | undefined {
  // Guards against circular re-exports
  const key = `${sourceFile.fileName}#${exportedName}`;
  if (visitedExports.has(key)) {
    return;
  }
  visitedExports.add(key);

  const wildcardSpecifiers = new Array<Expression>();
  for (const statement of sourceFile.statements) {
    // export class X {} / export default class X {} / export const x = ...
    const declaration = finder.exported(statement, exportedName);
    if (declaration) {
      return { sourceFile, declaration };
    }

    // class X {}; export default X;
    if (isExportAssignment(statement) && !statement.isExportEquals && exportedName === 'default' && isIdentifier(statement.expression)) {
      return resolveLocal(sourceFile, statement.expression.text, finder, context, visitedExports);
    }

    if (isExportDeclaration(statement)) {
      const { exportClause, moduleSpecifier } = statement;

      // export * from './x'
      if (!exportClause && moduleSpecifier) {
        wildcardSpecifiers.push(moduleSpecifier);
      }

      // export { Y as X } from './y' / export { Y as X }
      if (exportClause && isNamedExports(exportClause)) {
        const element = exportClause.elements.find(el => el.name.text === exportedName);
        if (element) {
          const name = (element.propertyName ?? element.name).text;
          return moduleSpecifier
            ? resolveImported(sourceFile, moduleSpecifier, name, finder, context, visitedExports)
            : resolveLocal(sourceFile, name, finder, context, visitedExports);
        }
      }
    }
  }

  // `export *` never re-exports the default export
  if (exportedName === 'default') {
    return;
  }

  for (const moduleSpecifier of wildcardSpecifiers) {
    const resolved = resolveImported(sourceFile, moduleSpecifier, exportedName, finder, context, visitedExports);
    if (resolved) {
      return resolved;
    }
  }

  return;
}

/**
 * Checks whether `declaration` is the class exported as `exportedName`.
 *
 * @param declaration - The class declaration to check.
 * @param exportedName - The exported name, `'default'` for the default export.
 * @returns `true` if the class is exported under that name.
 */
function isClassExportedAs(declaration: ClassDeclaration, exportedName: string): boolean {
  if (exportedName === 'default') {
    return !!declaration.modifiers?.some(modifier => modifier.kind === SyntaxKind.DefaultKeyword);
  }

  return declaration.name?.text === exportedName;
}

/**
 * Returns the parsed `fileName`, reusing the cached parse while the file is
 * unchanged, and records it as a dependency of the current extraction.
 *
 * @param fileName - Path of the file to parse.
 * @param context - State of the current extraction.
 * @returns The parsed file, or `undefined` if it can't be read.
 */
function getSourceFile(fileName: string, context: ResolutionContext): SourceFile | undefined {
  let sourceFile: SourceFile;
  try {
    const { mtimeMs, size } = statSync(fileName);
    const cached = sourceFileCache.get(fileName);
    if (cached?.modifiedTime === mtimeMs && cached.size === size) {
      sourceFile = cached.sourceFile;
    } else {
      sourceFile = createSourceFile(fileName, readFileSync(fileName, 'utf-8'), ScriptTarget.Latest, true);
      sourceFileCache.set(fileName, { modifiedTime: mtimeMs, size, sourceFile });
    }
  } catch {
    return undefined;
  }

  context.dependencies.add(fileName);
  return sourceFile;
}

/**
 * Clears the cache of the parsed files, e.g. on dev server shutdown.
 */
export function clearSourceFileCache(): void {
  sourceFileCache.clear();
}