import { ClassElement, EntityName, Expression, Identifier, Node, PropertyDeclaration, SourceFile, Statement, ModifierFlags, SyntaxKind, VariableDeclaration, forEachChild, getCombinedModifierFlags, isCallExpression, isGetAccessorDeclaration, isIdentifier, isImportDeclaration, isMethodDeclaration, isNamespaceImport, isPropertyAccessExpression, isPropertyDeclaration, isQualifiedName, isStringLiteralLike, isTypeReferenceNode, isVariableStatement } from 'typescript';
import { GLOBAL_IDENTIFIERS } from '../../generator/utils/generator/generator.utils';
import type { ComponentMembers } from '../../types/component-members/component-members.type';
import type { ClassDeclarationWithName } from '../../types/typescript-decorator-nodes.type';
import { DEFAULT_COMPILER_OPTIONS, clearSourceFileCache, resolveBaseClass, resolveReference } from '../resolve-declaration/resolve-declaration.utils';
import type { DeclarationFinder } from '../resolve-declaration/types/declaration-finder.type';
import type { ResolutionContext } from '../resolve-declaration/types/resolution-context.type';
import type { ResolvedClass } from '../resolve-declaration/types/resolved-class.type';
import type { MemberReads } from './types/member-reads.type';
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
 * Statically resolves the class members of a component (including those
 * inherited from a base class — possibly from a pre-compiled library with
 * only `.d.ts` available) that change how its template is compiled, without any
 * type-checker/`Program`: those backed by a signal or reading one, and those
 * named like a global identifier, which they shadow in the template.
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
 * The methods and getters whose body reads one of those members, a module
 * signal or another such method are listed too: a template binding calling
 * them is reactive. Calls that can't be traced back to a signal don't count.
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
 * @returns The reactive members (signal members and reactive methods) and the members shadowing a global,
 *   each listed once, and the files read to resolve them.
 */
export function extractComponentMembers(sourceFile: SourceFile, classDeclaration: ClassDeclarationWithName, compilerOptions = DEFAULT_COMPILER_OPTIONS): ComponentMembers {
  const context: ResolutionContext = {
    compilerOptions,
    dependencies: new Set(),
    visitedClasses: new Set([classDeclaration])
  };

  const chain = collectClassChain({ sourceFile, declaration: classDeclaration }, context);
  const signals = collectSignalMembers(chain, context);
  const reactiveMembers = [...signals, ...collectReactiveMethods(chain, new Set(signals), context)];
  return { reactiveMembers, shadowingMembers: collectShadowingMembers(chain), dependencies: [...context.dependencies] };
}

/**
 * Collects the instance members of an inheritance chain named like a global identifier: a template
 * reading one of those names reads the member, not the global.
 *
 * @param chain - The inheritance chain, the farthest base class first.
 * @returns The names of the members, each listed once, inherited ones first.
 */
function collectShadowingMembers(chain: readonly ResolvedClass[]): string[] {
  const members = chain.flatMap(({ declaration }) => declaration.members.flatMap(member => {
    const isStatic = !!(getCombinedModifierFlags(member) & ModifierFlags.Static);
    return isNamedMember(member) && !isStatic && GLOBAL_IDENTIFIERS.has(member.name.text) ? [member.name.text] : [];
  }));
  return [...new Set(members)];
}

/**
 * Collects the inheritance chain of `klass`, skipping the base classes that can't be resolved.
 *
 * @param klass - The class whose chain is collected.
 * @param context - State of the current extraction.
 * @returns The classes of the chain, the farthest base class first and `klass` last.
 */
function collectClassChain(klass: ResolvedClass, context: ResolutionContext): ResolvedClass[] {
  const base = resolveBaseClass(klass, context);
  if (!base || context.visitedClasses.has(base.declaration)) {
    return [klass];
  }

  context.visitedClasses.add(base.declaration);
  return [...collectClassChain(base, context), klass];
}

/**
 * Collects the signal fields of an inheritance chain. A member declared again overrides the inherited one:
 * it is a signal member only if the class declaring it again makes it one.
 *
 * @param chain - The inheritance chain, the farthest base class first.
 * @param context - State of the current extraction.
 * @returns The signal fields, each listed once, inherited ones first.
 */
function collectSignalMembers(chain: readonly ResolvedClass[], context: ResolutionContext): string[] {
  let members = new Array<string>();
  for (let i = 0; i < chain.length; i++) {
    const klass = chain[i];
    const declared = new Set(klass.declaration.members.flatMap(member => isNamedMember(member) ? [member.name.text] : []));
    members = [...new Set([...members.filter(name => !declared.has(name)), ...extractOwnSignalMembers(klass, context)])];
  }
  return members;
}

/**
 * Collects the reactive methods and getters of an inheritance chain: those whose body reads a signal field
 * (`this.count()`), a module signal (`count()`) or another reactive method or getter (`this.total()`, `this.label`).
 * Calls that can't be traced back to a signal, as those to functions of other modules or to members of other
 * objects, don't make a method reactive. A member declared again overrides the inherited one.
 *
 * @param chain - The inheritance chain, the farthest base class first.
 * @param signals - The signal fields of the chain.
 * @param context - State of the current extraction.
 * @returns The names of the reactive methods and getters, in declaration order, inherited ones first.
 */
function collectReactiveMethods(chain: readonly ResolvedClass[], signals: ReadonlySet<string>, context: ResolutionContext): string[] {
  const methods = new Map<string, MemberReads>();
  for (let i = 0; i < chain.length; i++) {
    const { sourceFile, declaration } = chain[i];
    for (let j = 0; j < declaration.members.length; j++) {
      const member = declaration.members[j];
      if (!isNamedMember(member)) {
        continue;
      }

      methods.delete(member.name.text);
      if ((isMethodDeclaration(member) || isGetAccessorDeclaration(member)) && member.body) {
        methods.set(member.name.text, collectMemberReads(member.body, sourceFile, isGetAccessorDeclaration(member), context));
      }
    }
  }

  // A method is reactive when it reads a reactive member, which may be a method found reactive later on
  const reactive = new Set(signals);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [name, reads] of methods) {
      if (!reactive.has(name) && readsReactiveMember(reads, reactive, methods)) {
        reactive.add(name);
        changed = true;
      }
    }
  }

  return [...methods.keys()].filter(name => reactive.has(name) && !signals.has(name));
}

/**
 * Collects what the body of a method or of a getter reads: the members it calls and accesses through `this`,
 * and whether it calls a module signal.
 *
 * @param body - The body of the method or of the getter.
 * @param sourceFile - The file declaring the method.
 * @param getter - Whether the member is a getter.
 * @param context - State of the current extraction.
 * @returns What the body reads.
 */
function collectMemberReads(body: Node, sourceFile: SourceFile, getter: boolean, context: ResolutionContext): MemberReads {
  const reads: MemberReads = { getter, calls: new Set(), accesses: new Set(), readsModuleSignal: false };
  const visit = (node: Node): void => {
    if (isPropertyAccessExpression(node) && node.expression.kind === SyntaxKind.ThisKeyword) {
      const calls = isCallExpression(node.parent) && node.parent.expression === node;
      (calls ? reads.calls : reads.accesses).add(node.name.text);
    } else if (isCallExpression(node) && isIdentifier(node.expression) && !reads.readsModuleSignal) {
      reads.readsModuleSignal = isSignalReference(sourceFile, node.expression, context, new Set());
    }
    forEachChild(node, visit);
  };
  visit(body);
  return reads;
}

/**
 * Checks whether a method or a getter reads a reactive member: calls a signal field or a reactive method, or accesses
 * a reactive getter.
 *
 * @param reads - What the body of the method or of the getter reads.
 * @param reactive - The members known to be reactive so far.
 * @param methods - What the methods and the getters of the chain read, by name.
 * @returns `true` if the member reads a reactive member.
 */
function readsReactiveMember(reads: MemberReads, reactive: ReadonlySet<string>, methods: ReadonlyMap<string, MemberReads>): boolean {
  return reads.readsModuleSignal
    || [...reads.calls].some(name => reactive.has(name) && !methods.get(name)?.getter)
    || [...reads.accesses].some(name => reactive.has(name) && !!methods.get(name)?.getter);
}

/**
 * Tells whether a class member is declared with a plain name, as `count` and not `['count']`.
 *
 * @param member - The class member.
 * @returns `true` if the member has an identifier as name.
 */
function isNamedMember(member: ClassElement): member is ClassElement & { name: Identifier } {
  return !!member.name && isIdentifier(member.name);
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
      for (let i = 0; i < namedBindings.elements.length; i++) {
        named.add(namedBindings.elements[i].name.text);
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
  for (let i = 0; i < declaration.members.length; i++) {
    const member = declaration.members[i];
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
  /*
    A signal type makes the member a signal member whatever initialises it: the @Property accessors,
    declared without initializer, and members initialised by a function returning a signal
    (`log: Signal<string> = createLog()`)
  */
  if (member.type && isTypeReferenceNode(member.type) && resolvesEntityNameToSignalBinding(member.type.typeName, bindings)) {
    return true;
  }

  if (!member.initializer) {
    return false;
  }

  // Handle initialization by function: input, computed, etc...
  if (isCallExpression(member.initializer)) {
    return resolvesToSignalBinding(member.initializer.expression, bindings);
  }

  /*
    import { count } from './cart.store';

    class Foo {
      count = count;
    }
  */
  return isSignalReference(sourceFile, member.initializer, context, new Set());
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
export function clearComponentMembersCache(): void {
  clearSourceFileCache();
}