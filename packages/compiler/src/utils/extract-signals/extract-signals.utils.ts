import { readFileSync, statSync } from 'node:fs';
import { ClassDeclaration, CompilerOptions, Declaration, EntityName, Expression, ImportDeclaration, ModuleKind, ModuleResolutionKind, PropertyDeclaration, ScriptTarget, SourceFile, Statement, SyntaxKind, VariableDeclaration, createSourceFile, forEachChild, isCallExpression, isClassDeclaration, isExportAssignment, isExportDeclaration, isIdentifier, isImportDeclaration, isNamedExports, isNamedImports, isNamespaceImport, isPropertyAccessExpression, isPropertyDeclaration, isQualifiedName, isStringLiteralLike, isTypeReferenceNode, isVariableStatement, resolveModuleName, sys } from 'typescript';
import type { SignalMembers } from '../../types/signal-members/signal-members.type';
import type { ClassDeclarationWithName } from '../../types/typescript-decorator-nodes.type';
import type { CachedSourceFile } from './types/cached-source-file.type';
import type { ResolutionContext } from './types/resolution-context.type';
import type { DeclarationFinder } from './types/declaration-finder.type';
import type { ResolvedClass } from './types/resolved-class.type';
import type { ResolvedDeclaration } from './types/resolved-declaration.type';
import type { SignalImportBindings } from './types/signal-import-bindings.type';

/**
 * Module specifiers exporting the signal functions and types a class member
 * must be initialised with, or typed as, to be recognised as a signal.
 */
const SIGNAL_MODULE_SPECIFIERS: ReadonlySet<string> = new Set(['@xaendar/core/signals']);

/**
 * Module resolution used when the caller doesn't supply the project compiler
 * options: honours `package.json` "types"/"typings"/"exports" and extensionless
 * relative specifiers, like the bundlers Xaendar components are built with.
 */
const DEFAULT_COMPILER_OPTIONS: CompilerOptions = {
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
 * Finds the module-level variable declarations of a file: the module signals a member can be initialised with.
 */
const VARIABLE_FINDER: DeclarationFinder<VariableDeclaration> = {
  local: (statement, localName) => findVariable(statement, localName),
  exported: (statement, exportedName) => isVariableStatement(statement) && statement.modifiers?.some(modifier => modifier.kind === SyntaxKind.ExportKeyword) ? findVariable(statement, exportedName) : undefined
};

/**
 * Parsed ancestor files, keyed by path. Components usually share the same
 * bases (at least `CustomElement`), so each file is parsed once and
 * reparsed only when its modification time or size changes.
 */
const sourceFileCache = new Map<string, CachedSourceFile>();

/**
 * Statically resolves which class members of a component (including those
 * inherited from a base class — possibly from a pre-compiled library with
 * only `.d.ts` available) are backed by a signal, without any
 * type-checker/`Program`.
 *
 * Walks the `extends` chain: a base class can be declared in the same file,
 * or imported (also through a namespace import, e.g. `extends ns.Base`) from
 * a project file, an npm package or a TypeScript path alias, all resolved with
 * the TypeScript module resolution. Re-exports (`export { X } from`,
 * `export * from`, `export { X }`, `export default X`) are followed until the
 * class declaration is found. `.d.ts` files never carry initializers,
 * so for them only the explicit type-annotation shape
 * (`declare x: Signal<T>` / `accessor x: InputSignal<T>`) is meaningful —
 * which `isSignalMember` already handles.
 *
 * A member initialised with a module-level signal (`count = count`,
 * `count = store.count`) is a signal member too: the variable is resolved
 * the same way, through imports and re-exports, and must be initialised
 * through a signal function, typed as a signal, or itself initialised
 * with a module-level signal. No annotation is needed on the member.
 *
 * Unresolvable ancestors (missing file, class expressions, mixins, etc.) are
 * skipped silently: this can only ever produce a false negative for THAT
 * ancestor's own members, which degrades to the existing conservative
 * default (treated as reactive), never to an incorrect "not a signal".
 *
 * @param sourceFile - Parsed TypeScript source of the component file being compiled.
 * @param classDeclaration - Declaration of the class to be compiled.
 * @param compilerOptions - Project compiler options, driving how the modules
 *   declaring the base classes are resolved (e.g. `paths` aliases).
 * @returns The signal members, own members last so they correctly shadow
 *   inherited ones, and the files read to resolve them.
 */
export function extractSignalMembers(sourceFile: SourceFile, classDeclaration: ClassDeclarationWithName, compilerOptions = DEFAULT_COMPILER_OPTIONS): SignalMembers {
  const context: ResolutionContext = {
    compilerOptions,
    dependencies: new Set(),
    visitedClasses: new Set([classDeclaration])
  };

  const members = collectSignalMembers({ sourceFile, declaration: classDeclaration }, context);
  return { members, dependencies: [...context.dependencies] };
}

/**
 * Collects the signal members of `klass`, walking its whole inheritance chain.
 *
 * @param klass - The class to collect the signal members of.
 * @param context - State of the current extraction.
 * @returns The signal members, inherited ones first.
 */
function collectSignalMembers(klass: ResolvedClass, context: ResolutionContext): string[] {
  const base = resolveBaseClass(klass, context);
  let inherited = new Array<string>();
  if (base && !context.visitedClasses.has(base.declaration)) {
    context.visitedClasses.add(base.declaration);
    inherited = collectSignalMembers(base, context);
  }

  const own = extractOwnSignalMembers(klass, context);
  return [...inherited, ...own];
}

/**
 * Resolves the class `klass` directly extends, if any.
 *
 * @param klass - The class whose base class is resolved.
 * @param context - State of the current extraction.
 * @returns The base class with the file declaring it, or `undefined` when
 *   `klass` extends nothing or its base class can't be resolved.
 */
function resolveBaseClass({ sourceFile, declaration }: ResolvedClass, context: ResolutionContext): ResolvedClass | undefined {
  const expression = getBaseClassExpression(declaration);
  if (!expression) {
    return;
  }

  return resolveReference(sourceFile, expression, CLASS_FINDER, context, new Set());
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
function resolveReference<D extends Declaration>(sourceFile: SourceFile, expression: Expression, finder: DeclarationFinder<D>, context: ResolutionContext, visitedExports: Set<string>): ResolvedDeclaration<D> | undefined {
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

  return;
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

  return;
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
 * Finds the variable named `name` declared by `statement`.
 *
 * @param statement - The statement to inspect.
 * @param name - The name of the variable.
 * @returns The variable declaration, or `undefined` if `statement` doesn't declare it.
 */
function findVariable(statement: Statement, name: string): VariableDeclaration | undefined {
  if (!isVariableStatement(statement)) {
    return;
  }

  return statement.declarationList.declarations.find(declaration => isIdentifier(declaration.name) && declaration.name.text === name);
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
 * Collects the local names the signal modules are imported under in `sourceFile`.
 *
 * @param sourceFile - The file whose imports are inspected.
 * @returns The named and namespace bindings of the signal modules.
 */
function collectSignalImportBindings(sourceFile: SourceFile): SignalImportBindings {
  const named = new Set<string>();
  const namespaces = new Set<string>();

  forEachChild(sourceFile, node => {
    if (!isImportDeclaration(node) || !isStringLiteralLike(node.moduleSpecifier)) {
      return;
    }

    if (!SIGNAL_MODULE_SPECIFIERS.has(node.moduleSpecifier.text)) {
      return;
    }

    const namedBindings = node.importClause?.namedBindings;
    if (!namedBindings) {
      return
    }

    if (isNamespaceImport(namedBindings)) {
      namespaces.add(namedBindings.name.text);
    } else {
      for (const element of namedBindings.elements) {
        named.add(element.name.text);
      }
    }
  });

  return { named, namespaces };
}

/**
 * Extracts the signal members declared by a class itself, ignoring inherited ones.
 *
 * @param klass - The class whose members are inspected, with the file declaring it.
 * @param context - State of the current extraction.
 * @returns The names of the own signal members.
 */
function extractOwnSignalMembers({ sourceFile, declaration }: ResolvedClass, context: ResolutionContext): string[] {
  const bindings = collectSignalImportBindings(sourceFile);
  const result = new Array<string>();
  for (const member of declaration.members) {
    if (isPropertyDeclaration(member) && isIdentifier(member.name) && isSignalMember(member, sourceFile, bindings, context)) {
      result.push(member.name.text);
    }
  }
  return result;
}

/**
 * Checks whether `member` is initialised through a signal function, typed as a signal,
 * or initialised with a module-level signal (`count = count`, `count = store.count`).
 *
 * @param member - The property declaration to check.
 * @param sourceFile - The file declaring the member.
 * @param bindings - The signal module bindings of the file declaring the member.
 * @param context - State of the current extraction.
 * @returns `true` if the member is backed by a signal.
 */
function isSignalMember(member: PropertyDeclaration, sourceFile: SourceFile, bindings: SignalImportBindings, context: ResolutionContext): boolean {
  // Handle initialization by function: input, computed, etc...
  if (member.initializer && isCallExpression(member.initializer)) {
    return resolvesToSignalBinding(member.initializer.expression, bindings);
  }

  /*
    Handle specific case introduced by @Property decorator where
    there is no initialization but only a type reference
  */
  if (member.type && isTypeReferenceNode(member.type)) {
    return resolvesEntityNameToSignalBinding(member.type.typeName, bindings);
  }

  /*
    import { count } from './cart.store';

    class Foo {
      count = count;
    }
  */
  return !!member.initializer && isSignalReference(sourceFile, member.initializer, context, new Set());
}

/**
 * Checks whether `expression` refers to a module-level signal: a variable, declared in the file
 * or imported into it, initialised through a signal function, typed as a signal, or itself
 * initialised with a module-level signal.
 *
 * @param sourceFile - The file containing the expression.
 * @param expression - The expression to check.
 * @param context - State of the current extraction.
 * @param visitedVariables - Variables already visited, to stop on circular initialisations.
 * @returns `true` if `expression` refers to a module-level signal.
 */
function isSignalReference(sourceFile: SourceFile, expression: Expression, context: ResolutionContext, visitedVariables: Set<VariableDeclaration>): boolean {
  const variable = resolveReference(sourceFile, expression, VARIABLE_FINDER, context, new Set());
  if (!variable || visitedVariables.has(variable.declaration)) {
    return false;
  }
  visitedVariables.add(variable.declaration);

  const { declaration } = variable;
  const bindings = collectSignalImportBindings(variable.sourceFile);
  if (declaration.type) {
    return isTypeReferenceNode(declaration.type) && resolvesEntityNameToSignalBinding(declaration.type.typeName, bindings);
  }

  if (!declaration.initializer) {
    return false;
  }

  return isCallExpression(declaration.initializer)
    ? resolvesToSignalBinding(declaration.initializer.expression, bindings)
    : isSignalReference(variable.sourceFile, declaration.initializer, context, visitedVariables);
}

/**
 * Checks whether the callee `expr` of a member initializer is a signal function.
 *
 * @param expr - The called expression.
 * @param bindings - The signal module bindings of the file declaring the member.
 * @returns `true` if `expr` refers to a signal module export.
 */
function resolvesToSignalBinding(expr: Expression, bindings: SignalImportBindings): boolean {
  /*
    import { signal } from '@xaendar/core/signals';

    class Foo {
      x = signal(false);
    }
  */
  if (isIdentifier(expr)) {
    return bindings.named.has(expr.text);
  }

  /*
    import * as signals from '@xaendar/core/signals';

    class Foo {
      x = signals.signal(false);
      y = signals.computed(() => ...);
    }
  */
  if (isPropertyAccessExpression(expr) && isIdentifier(expr.expression)) {
    return bindings.namespaces.has(expr.expression.text);
  }

  return false;
}

/**
 * Checks whether the type name `entityName` of a member annotation is a signal type.
 *
 * @param entityName - The referenced type name.
 * @param bindings - The signal module bindings of the file declaring the member.
 * @returns `true` if `entityName` refers to a signal module export.
 */
function resolvesEntityNameToSignalBinding(entityName: EntityName, bindings: SignalImportBindings): boolean {
  /*
    import { InputSignal } from '@xaendar/core/signals';

    class Foo {
      @Property(false)
      accessor x!: InputSignal<boolean>
    }
  */
  if (isIdentifier(entityName)) {
    return bindings.named.has(entityName.text);
  }

  /*
    import * as signals from '@xaendar/core/signals';

    class Foo {
      @Property(false)
      accessor x!: signals.InputSignal<boolean>
    }
  */
  if (isQualifiedName(entityName) && isIdentifier(entityName.left)) {
    return bindings.namespaces.has(entityName.left.text);
  }

  return false;
}

/**
 * Clears the cache of the parsed ancestor files, e.g. on dev server shutdown.
 */
export function clearSignalMembersCache(): void {
  sourceFileCache.clear();
}