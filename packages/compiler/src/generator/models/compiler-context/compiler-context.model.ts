import { matchesCustomElementPattern } from '@xaendar/common';
import type { CompilerCache } from '../../../types/compiler-cache.type';

/**
 * Whether a declared identifier holds a plain value or a signal.
 * Used by `resolveExpression`/`resolveIdentifier` to decide, at compile
 * time, whether generated access code needs a trailing `()` to unwrap the
 * signal — no runtime type detection is ever needed.
 */
export type IdentifierKind = 'value' | 'signal';

/**
 * A name a template imports from a module (see `SymbolImport`), as an expression reads it.
 */
export type ImportedIdentifier = {
  /**
   * The expression replacing the name: the alias the module is imported as in the generated code.
   */
  expression: string;
  /**
   * Whether reading the name can read a signal.
   */
  kind: IdentifierKind;
  /**
   * Whether an expression has read the name, i.e. whether the generated code must import it.
   */
  used: boolean;
};

/**
 * Tracks identifier scope during render code generation.
 * Each `Context` instance represents one lexical scope (e.g. a `@for` loop body)
 * and can be chained to a parent context for outer-scope resolution.
 */
export class CompilerContext {
  /**
   * The compiler cache associated with this context, used to store and retrieve
   * intermediate compilation results for efficiency.
   */
  public cache?: CompilerCache;
  /**
   * Parent context representing the enclosing scope.
   */
  protected parent: CompilerContext | undefined;
  /**
   * A set containting all the signals declared in the class (and subclasses)
   * associated to the template
   */
  private readonly _componentSignalsFields = new Set<string>();
  /**
   * Members of the class (and of its base classes) associated to the template named like
   * a global identifier, which they shadow in the template (e.g. a `name` field)
   */
  private readonly _componentShadowingMembers = new Set<string>();
  /**
   * Patterns of the tag names of the custom elements of other libraries (e.g. `sl-*`),
   * which the template uses like native elements
   */
  private readonly _customElementPatterns = new Array<string>();
  /**
   * Identifiers declared directly in this scope, mapped to whether they
   * hold a plain value or a signal (e.g. the item of a `@for` and its implicit
   * variables like `$index` are signals).
   */
  private readonly _identifiers = new Map<string, IdentifierKind>();
  /**
   * List of identifiers that should not be resolved
   * and touched in anyway
   * (e.g. $event)
   */
  private readonly _unresolvableIdentifiers = new Map<string, IdentifierKind>();
  /**
   * Names the template imports from modules, mapped to how an expression reads them
   */
  private readonly _importedIdentifiers = new Map<string, ImportedIdentifier>();

  /**
   * Creates a new scope context.
   *
   * @param parent - Optional parent context representing the enclosing scope.
   */
  constructor(
    parent?: CompilerContext,
  ) {
    if (parent) {
      this.parent = parent;
      this.cache = parent.cache;
    }
  }

  /**
   * Registers a new identifier name in this scope.
   *
   * @param name - The identifier name to register.
   * @param kind - Whether the identifier holds a plain value or a signal.
   *   Defaults to `'value'`.
   * @throws When an identifier with the same name is already declared in this scope.
   */
  public addIdentifier(name: string, kind: IdentifierKind = 'value'): void {
    if (this._identifiers.has(name)) {
      throw new Error(`Identifier "${name}" is already declared in this scope.`);
    }

    this._identifiers.set(name, kind);
  }

  /**
   * Registers a new unresolvable identifier name in this scope.
   * Unresolvable identifiers (e.g. `$event`) are tracked so lookups via
   * {@link hasIdentifier} recognize them, but they are never meant to be
   * resolved or otherwise manipulated by the compiler.
   *
   * @param name - The identifier name to register.
   * @throws When an identifier with the same name is already declared in this scope.
   */
  public addUnresolvableIdentifier(name: string, kind: IdentifierKind = 'value'): void {
    if (this._unresolvableIdentifiers.has(name)) {
      throw new Error(`Identifier "${name}" is already declared in this scope.`);
    }

    this._unresolvableIdentifiers.set(name, kind);
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
   * Registers a class member named like a global identifier, which it shadows in the template.
   *
   * @param name - The name of the member.
   */
  public addShadowingMember(name: string): void {
    this._componentShadowingMembers.add(name);
  }

  /**
   * Registers the patterns of the tag names of the custom elements of other libraries.
   *
   * @param patterns - The patterns, where `*` stands for any sequence of characters.
   */
  public addCustomElementPatterns(...patterns: readonly string[]): void {
    this._customElementPatterns.push(...patterns);
  }

  /**
   * Removes a previously registered identifier from this scope, if present.
   * Does nothing if no identifier with the given name is declared in this scope.
   * Note: this only affects the current scope, not any ancestor scopes.
   *
   * @param name - The identifier name to remove.
   */
  public removeIdentifier(name: string): void {
    this._identifiers.delete(name);
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
   * Returns `true` if an identifier with the given name is declared in this
   * scope or any of its ancestor scopes.
  *
  * @param name - The identifier name to look up.
  * @returns `true` if the identifier exists in the scope chain, `false` otherwise.
  */
  public hasUnresolvableIdentifier(name: string): boolean {
    return this._unresolvableIdentifiers.has(name) || (this.parent?.hasUnresolvableIdentifier(name) ?? false);
  }

  /**
   * Returns `true` if a signal field with the given name is declared in this
   * scope or any of its ancestor scopes.
   *
   * @param name - The signal field name to look up.
   * @returns `true` if the ignal field exists in the scope chain, `false` otherwise.
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
   * Resolves the kind (`'value'` or `'signal'`) of a declared identifier,
   * walking up the scope chain if not found in this scope.
   *
   * @param name - The identifier name to look up.
   * @returns The identifier's kind, or `undefined` if it isn't declared
   *   anywhere in the scope chain.
   */
  public getIdentifierKind(name: string): IdentifierKind | undefined {
    return this._identifiers.get(name) ?? this.parent?.getIdentifierKind(name);
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
}