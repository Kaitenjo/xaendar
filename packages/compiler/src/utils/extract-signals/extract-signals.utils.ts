import { EntityName, Expression, PropertyDeclaration, SourceFile, Statement, SyntaxKind, VariableDeclaration, forEachChild, isCallExpression, isIdentifier, isImportDeclaration, isNamespaceImport, isPropertyAccessExpression, isPropertyDeclaration, isQualifiedName, isStringLiteralLike, isTypeReferenceNode, isVariableStatement } from 'typescript';
import type { SignalMembers } from '../../types/signal-members/signal-members.type';
import type { ClassDeclarationWithName } from '../../types/typescript-decorator-nodes.type';
import { DEFAULT_COMPILER_OPTIONS, clearSourceFileCache, resolveBaseClass, resolveReference } from '../resolve-declaration/resolve-declaration.utils';
import type { DeclarationFinder } from '../resolve-declaration/types/declaration-finder.type';
import type { ResolutionContext } from '../resolve-declaration/types/resolution-context.type';
import type { ResolvedClass } from '../resolve-declaration/types/resolved-class.type';
import type { SignalImportBindings } from './types/signal-import-bindings.type';

/**
 * Module specifiers exporting the signal functions and types a class member
 * must be initialised with, or typed as, to be recognised as a signal.
 */
const SIGNAL_MODULE_SPECIFIERS: ReadonlySet<string> = new Set(['@xaendar/core/signals']);

/**
 * Finds the module-level variable declarations of a file: the module signals a member can be initialised with.
 */
const VARIABLE_FINDER: DeclarationFinder<VariableDeclaration> = {
  local: (statement, localName) => findVariable(statement, localName),
  exported: (statement, exportedName) => isVariableStatement(statement) && statement.modifiers?.some(modifier => modifier.kind === SyntaxKind.ExportKeyword) ? findVariable(statement, exportedName) : undefined
};

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
 * @returns The signal members, each listed once, and the files read to resolve them.
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
 * Collects the signal members of `klass`, walking its whole inheritance chain. A member declared again
 * overrides the inherited one: it is a signal member only if the class declaring it again makes it one.
 *
 * @param klass - The class to collect the signal members of.
 * @param context - State of the current extraction.
 * @returns The signal members, each listed once, inherited ones first.
 */
function collectSignalMembers(klass: ResolvedClass, context: ResolutionContext): string[] {
  const base = resolveBaseClass(klass, context);
  let inherited = new Array<string>();
  if (base && !context.visitedClasses.has(base.declaration)) {
    context.visitedClasses.add(base.declaration);
    inherited = collectSignalMembers(base, context);
  }

  const declared = new Set(klass.declaration.members.flatMap(member => isPropertyDeclaration(member) && isIdentifier(member.name) ? [member.name.text] : []));
  const own = extractOwnSignalMembers(klass, context);
  return [...new Set([...inherited.filter(name => !declared.has(name)), ...own])];
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
  clearSourceFileCache();
}