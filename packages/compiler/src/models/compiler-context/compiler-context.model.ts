import { matchesCustomElementPattern } from '@xaendar/common';
import { SCOPE_HEADER } from '../../costants/scope-header.costant';
import type { DeclaredIdentifier } from '../../generator/types/declared-identifier.type';
import type { IdentifierKind } from '../../generator/types/identifier-kind.type';
import type { ImportedIdentifier } from '../../generator/types/imported-identifier.type';
import type { ScopeKind } from '../../generator/types/scope-kind.type';
import type { VariableAddress } from '../../generator/types/variable-address.type';
import type { ElementNamespace } from '../../types/element-namespace.type';

/**
 * Tracks the identifiers of one lexical scope of a template (e.g. a `@for` loop body), shared by the generator and the
 * type checker: each instance can be chained to a parent context for outer-scope resolution.
 */
export class CompilerContext {
  /**
   * A set containting all the signals declared in the class (and subclasses)
   * associated to the template
   */
  private readonly _componentSignalsFields = new Set<string>();
  /**
   * Patterns of the tag names of the custom elements of other libraries (e.g. `sl-*`),
   * which the template uses like native elements
   */
  private readonly _customElementPatterns = new Array<string>();
  /**
   * Members of the class (and of its base classes) associated to the template named like
   * a global identifier, which they shadow in the template (e.g. a `name` field)
   */
  private readonly _componentShadowingMembers = new Set<string>();
  /**
   * Identifiers declared directly in this scope, mapped to what they hold (see
   * `IdentifierKind`) and where the runtime keeps them: e.g. the item of a `@for` and its implicit variables like
   * `$index` are variables of the template.
   */
  private readonly _identifiers = new Map<string, DeclaredIdentifier>();
  /**
   * The names of the identifiers of this scope taking a slot of its runtime scope, in the order of their slots.
   */
  private readonly _variables = new Array<string>();
  /**
   * The number of identifiers declared in the whole template, numbering the next one: held by the root scope.
   */
  private _idCount = 0;
  /**
   * Names the template imports from modules, mapped to how an expression reads them
   */
  private readonly _importedIdentifiers = new Map<string, ImportedIdentifier>();
  /**
   * Templates declared directly in this scope, mapped to the namespace their content is created in
   */
  private readonly _templates = new Map<string, ElementNamespace>();
  /**
   * List of identifiers that should not be resolved
   * and touched in anyway
   * (e.g. $event)
   */
  private readonly _unresolvableIdentifiers = new Map<string, IdentifierKind>();

  /**
   * The number of identifiers declared in this scope taking a slot of its runtime scope, not in its ancestor scopes: the
   * variables its runtime scope holds after its header.
   *
   * @returns The number of variables of this scope.
   */
  public get identifierCount(): number {
    return this._variables.length;
  }

  /**
   * The names of the variables of this scope, in the order of their slots, the first one following the header.
   *
   * @returns The names.
   */
  public get variableNames(): readonly string[] {
    return this._variables;
  }

  /**
   * Whether this scope stands for a scope of the runtime, which the expressions inside it read the variables of the
   * enclosing scopes through (see `ScopeKind`).
   *
   * @returns `true` when it does.
   */
  public get opensScope(): boolean {
    return this._scopeKind === 'scope' || this._scopeKind === 'runtime' || this._variables.length > 0;
  }

  /**
   * Whether this scope stands for a branch rendered inline into the runtime scope holding its block (see `ScopeKind`).
   *
   * @returns `true` when it does.
   */
  public get inlineBranch(): boolean {
    return this._scopeKind === 'inline';
  }

  /**
   * Whether this scope stands for a scope the runtime creates with a layout of its own (see `ScopeKind`), where the
   * compiler reserves no slot.
   *
   * @returns `true` when it does.
   */
  public get runtimeScope(): boolean {
    return this._scopeKind === 'runtime';
  }

  /**
   * The namespace the elements declared in this scope are created in, looking in this scope first and then in the
   * ancestor scopes.
   *
   * @returns The namespace of the closest scope declaring one, `html` if none does.
   */
  public get namespace(): ElementNamespace {
    return this._namespace ?? this.parent?.namespace ?? 'html';
  }

  /**
   * Creates a new scope context.
   *
   * @param parent - Parent context representing the enclosing scope.
   * @param _namespace - The namespace the elements declared in this scope are created in, when it differs from the one of
   *   the enclosing scope, i.e. for the children of an `<svg>`, a `<math>` or a `<foreignObject>` element.
   * @param _scopeKind - Whether the scope stands for a scope of the runtime (see `ScopeKind`). Defaults to `scope`.
   */
  constructor(protected readonly parent?: CompilerContext, private readonly _namespace?: ElementNamespace, private readonly _scopeKind: ScopeKind = 'scope') { }

  /**
   * Registers the patterns of the tag names of the custom elements of other libraries.
   *
   * @param patterns - The patterns, where `*` stands for any sequence of characters.
   */
  public addCustomElementPatterns(...patterns: readonly string[]): void {
    this._customElementPatterns.push(...patterns);
  }

  /**
   * Registers a new identifier name in this scope. Unless it is read through an expression of its own, it takes the
   * next slot of the runtime scope, after the header and the variables registered before it, and an identifier unique
   * in the template.
   *
   * @param name - The identifier name to register.
   * @param kind - Whether the identifier holds a plain value or a signal.
   *   Defaults to `'value'`.
   * @param expression - The expression reading the identifier, for one taking no slot: a template, a constant of the
   *   module.
   * @throws When an identifier with the same name is already declared in this scope.
   */
  public addIdentifier(name: string, kind: IdentifierKind = 'value', expression?: string): void {
    if (this._identifiers.has(name)) {
      throw new Error(`Identifier "${name}" is already declared in this scope.`);
    }

    if (expression) {
      this._identifiers.set(name, { kind, expression });
      return;
    }

    this._identifiers.set(name, { kind, slot: SCOPE_HEADER + this._variables.length, id: this._nextId() });
    this._variables.push(name);
  }

  /**
   * Returns where a variable of the template lives at runtime, seen from this scope: how many runtime scopes up the
   * chain it is declared, its slot there and its identifier. Only the scopes standing for a scope of the runtime count
   * (see {@link opensScope}).
   *
   * @param name - The name of the variable.
   * @returns Its address, `undefined` when no scope declares it with a slot.
   */
  public addressOf(name: string): VariableAddress | undefined {
    let depth = 0;
    for (let context: CompilerContext | undefined = this; context; context = context.parent) {
      const declared = context._identifiers.get(name);
      if (declared) {
        return declared.slot === undefined ? undefined : { depth, slot: declared.slot, id: declared.id! };
      }

      if (context.opensScope) {
        depth++;
      }
    }

    return undefined;
  }

  /**
   * Returns how many runtime scopes up the chain the scope declaring an identifier is, seen from this scope: the one
   * holding a template, whose instances read its variables.
   *
   * @param name - The name of the identifier.
   * @returns The number of scopes, `0` for this scope, `undefined` when no scope declares it.
   */
  public depthOf(name: string): number | undefined {
    let depth = 0;
    for (let context: CompilerContext | undefined = this; context; context = context.parent) {
      if (context._identifiers.has(name)) {
        return depth;
      }

      if (context.opensScope) {
        depth++;
      }
    }

    return undefined;
  }

  /**
   * Returns the expression reading an identifier the scopes of the template declare, seen from this scope: its own
   * expression, or the read of its slot through the runtime scope (`_read(context, depth, slot)`, see `addressOf`).
   *
   * @param name - The name of the identifier, declared by this scope or by one of its ancestor scopes.
   * @returns The expression.
   */
  public readIdentifier(name: string): string {
    const address = this.addressOf(name);
    return address ? `_read(context, ${address.depth}, ${address.slot})` : this._findIdentifier(name)!.expression!;
  }

  /**
   * Returns the identifier, unique in the template, of a variable the scopes of the template declare.
   *
   * @param name - The name of the variable.
   * @returns The identifier, `undefined` for an identifier taking no slot.
   */
  public idOf(name: string): number | undefined {
    return this._findIdentifier(name)?.id;
  }

  /**
   * Registers a name the template imports from a module, which its expressions read in place of a member of the
   * component. The variables of the template shadow it.
   *
   * @param name - The name the template imports.
   * @param expression - The expression replacing the name in the generated code.
   * @param kind - Whether reading the name can read a signal. Defaults to `'value'`.
   */
  public addImportedIdentifier(name: string, expression: string, kind: IdentifierKind = 'value'): void {
    this._importedIdentifiers.set(name, { expression, kind, used: false });
  }

  /**
   * Registers a class member named like a global identifier, which it shadows in the template.
   *
   * @param name - The name of the member.
   */
  public addShadowingMember(name: string): void {
    this._componentShadowingMembers.add(name);
  }

  /**
   * Registers a new signal field name in this scope.
   *
   * @param name - The identifier name to register.
   * @throws When an identifier with the same name is already declared in this scope.
   */
  public addSignalClassField(name: string): void {
    if (this._componentSignalsFields.has(name)) {
      throw new Error(`Signal field "${name}" is already declared in this scope.`);
    }

    this._componentSignalsFields.add(name);
  }

  /**
   * Registers a template declared in this scope, whose content is created in the namespace of its declaration. Its name
   * is registered as an identifier of the scope on its own (see {@link addIdentifier}, {@link addUnresolvableIdentifier}).
   *
   * @param name - The name of the template.
   * @param namespace - The namespace the content of the template is created in.
   */
  public addTemplate(name: string, namespace: ElementNamespace): void {
    this._templates.set(name, namespace);
  }

  /**
   * Registers a new unresolvable identifier name in this scope.
   * Unresolvable identifiers (e.g. `$event`) are tracked so lookups via
   * {@link hasIdentifier} recognize them, but they are never meant to be
   * resolved or otherwise manipulated by the compiler.
   *
   * @param name - The identifier name to register.
   * @param kind - Whether the identifier holds a plain value or a signal. Defaults to `'value'`.
   * @throws When an identifier with the same name is already declared in this scope.
   */
  public addUnresolvableIdentifier(name: string, kind: IdentifierKind = 'value'): void {
    if (this._unresolvableIdentifiers.has(name)) {
      throw new Error(`Identifier "${name}" is already declared in this scope.`);
    }

    this._unresolvableIdentifiers.set(name, kind);
  }

  /**
   * Resolves the kind (`'value'` or `'signal'`) of a declared identifier,
   * walking up the scope chain if not found in this scope.
   *
   * @param name - The identifier name to look up.
   * @returns The identifier's kind, or `undefined` if it isn't declared
   *   anywhere in the scope chain.
   */
  public getIdentifierKind(name: string): IdentifierKind | undefined {
    return this._findIdentifier(name)?.kind;
  }

  /**
   * Returns how an expression reads a name the template imports, looking in this scope first and then in the
   * ancestor scopes.
   *
   * @param name - The name to look up.
   * @returns The imported identifier, `undefined` if the template doesn't import the name.
   */
  public getImportedIdentifier(name: string): ImportedIdentifier | undefined {
    return this._importedIdentifiers.get(name) ?? this.parent?.getImportedIdentifier(name);
  }

  /**
   * Returns the namespace the content of the template a name refers to is created in: the closest scope declaring the
   * name decides, so a variable of an inner scope named like a template hides it.
   *
   * @param name - The name to look up.
   * @returns The namespace of the template, `undefined` if the name doesn't refer to a template.
   */
  public getTemplateNamespace(name: string): ElementNamespace | undefined {
    return this.declaresIdentifier(name) ? this._templates.get(name) : this.parent?.getTemplateNamespace(name);
  }

  /**
   * Resolves the kind (`'value'` or `'signal'`) of a unresolvable declared identifier,
   * walking up the scope chain if not found in this scope.
   *
   * @param name - The unresolvable identifier name to look up.
   * @returns The unresolvable identifier's kind, or `undefined` if it isn't declared
   *   anywhere in the scope chain.
   */
  public getUnresolvableIdentifierKind(name: string): IdentifierKind | undefined {
    return this._unresolvableIdentifiers.get(name) ?? this.parent?.getUnresolvableIdentifierKind(name);
  }

  /**
   * Returns `true` if an identifier with the given name is declared in this
   * scope or any of its ancestor scopes.
   *
   * @param name - The identifier name to look up.
   * @returns `true` if the identifier exists in the scope chain, `false` otherwise.
   */
  public hasIdentifier(name: string): boolean {
    return this._identifiers.has(name) || (this.parent?.hasIdentifier(name) ?? false);
  }

  /**
   * Returns `true` if a signal field with the given name is declared in this
   * scope or any of its ancestor scopes.
   *
   * @param name - The signal field name to look up.
   * @returns `true` if the signal field exists in the scope chain, `false` otherwise.
   */
  public hasSignalField(name: string): boolean {
    return this._componentSignalsFields.has(name) || (this.parent?.hasSignalField(name) ?? false);
  }

  /**
   * Returns `true` if a class member named like a global identifier is registered in this
   * scope or any of its ancestor scopes.
   *
   * @param name - The member name to look up.
   * @returns `true` if the member exists in the scope chain, `false` otherwise.
   */
  public hasShadowingMember(name: string): boolean {
    return this._componentShadowingMembers.has(name) || (this.parent?.hasShadowingMember(name) ?? false);
  }

  /**
   * Returns `true` if an unresolvable identifier with the given name is declared in this
   * scope or any of its ancestor scopes.
   *
   * @param name - The identifier name to look up.
   * @returns `true` if the identifier exists in the scope chain, `false` otherwise.
   */
  public hasUnresolvableIdentifier(name: string): boolean {
    return this._unresolvableIdentifiers.has(name) || (this.parent?.hasUnresolvableIdentifier(name) ?? false);
  }

  /**
   * Returns `true` if a tag name matches one of the patterns of the custom elements of other libraries
   * registered in this scope or any of its ancestor scopes.
   *
   * @param tagName - The tag name to check.
   * @returns `true` if the tag is a custom element of another library, `false` otherwise.
   */
  public isForeignElement(tagName: string): boolean {
    return matchesCustomElementPattern(tagName, this._customElementPatterns) || (this.parent?.isForeignElement(tagName) ?? false);
  }

  /**
   * Removes a previously registered unresolvable identifier from this scope, if present.
   * Does nothing if no unresolvable identifier with the given name is declared in this scope.
   * Note: this only affects the current scope, not any ancestor scopes.
   *
   * @param name - The identifier name to remove.
   */
  public removeUnresolvabledIdentifier(name: string): void {
    this._unresolvableIdentifiers.delete(name);
  }

  /**
   * Returns `true` if an identifier, resolvable or not, is declared directly in this scope: the ones of its ancestor
   * scopes, which a declaration of this scope would shadow, don't count.
   *
   * @param name - The identifier name to look up.
   * @returns `true` if this scope declares the identifier, `false` otherwise.
   */
  public declaresIdentifier(name: string): boolean {
    return this._identifiers.has(name) || this._unresolvableIdentifiers.has(name);
  }

  /**
   * Returns an identifier declared in this scope or in the closest ancestor scope declaring it.
   *
   * @param name - The name of the identifier.
   * @returns The identifier, `undefined` when no scope declares it.
   */
  private _findIdentifier(name: string): DeclaredIdentifier | undefined {
    return this._identifiers.get(name) ?? this.parent?._findIdentifier(name);
  }

  /**
   * Numbers the next identifier of the template, in the root scope, which holds the count of the whole template.
   *
   * @returns The identifier.
   */
  private _nextId(): number {
    return this.parent ? this.parent._nextId() : this._idCount++;
  }
}
