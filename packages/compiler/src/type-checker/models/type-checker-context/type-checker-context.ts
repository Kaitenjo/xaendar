import { CompilerContext } from '../../../generator/models/compiler-context/compiler-context.model';
import { ComponentMetadata } from '../../../types/component-metadata.type';
import { ComponentOrDirectiveMetadata } from '../../../types/component-or-directive-metadata.type';
import { DirectiveMetadata } from '../../../types/directive-metadata.type';
import type { ImportSpecifier } from '../../../parser/types/nodes/import-specifier.type';
import type { ElementNamespace } from '../../../types/element-namespace.type';
import type { SymbolImport } from '../../../types/symbol-import.type';
import type { ElementEventMap } from '../../types/element-event-map.type';
import { getEventMap } from '../../utils/namespace-types/namespace-types.utils';

/**
 * Type checker context that manages imported component and directive metadata
 * for the compilation process. Extends the base CompilerContext to provide
 * import-specific functionality.
 */
export class TypeCheckContext extends CompilerContext {
    /**
   * Parent context representing the enclosing scope.
   */
  protected declare parent: TypeCheckContext | undefined;
  /**
   * Array of component and directive imports to be tracked during type checking.
   * Stores metadata extracted from @WebComponent and @Directive decorators.
   */
  private readonly _imports = new Array<ComponentOrDirectiveMetadata>;
  /**
   * The symbols the template imports from modules, which are neither components nor directives.
   */
  private readonly _symbols = new Array<SymbolImport>();
  /**
   * The positions of the elements whose generic component is instantiated in the scope of the element ref naming
   * them, which is typed with the instantiation: kept by the outermost scope, for the whole template.
   */
  private readonly _instantiations = new Set<number>();
  /**
   * Signals the conditions of an `@if` chain of this scope call, mapped to the constant holding their value (see
   * {@link addNarrowedSignal}).
   */
  private readonly _narrowedSignals = new Map<string, string>();
  /**
   * Whether the type-check code reads the declarations of the template helpers, as the one of a template or of a `@let`
   * reading a signal does: kept by the outermost scope, for the whole template.
   */
  private _usesTemplateHelpers = false;

  /**
   * Tells whether the type-check code of any of the scopes of the template reads the declarations of the template
   * helpers (see {@link recordTemplateHelpers}).
   *
   * @returns `true` if the helpers are read, `false` otherwise.
   */
  public get usesTemplateHelpers(): boolean {
    return this.parent ? this.parent.usesTemplateHelpers : this._usesTemplateHelpers;
  }

  /**
   * Returns the event map of the elements declared in this scope: the one of their namespace (see `namespace`).
   *
   * @returns The event map, `HTMLElementEventMap` for the HTML namespace.
   */
  public get eventMap(): ElementEventMap {
    return getEventMap(this.namespace);
  }

  /**
   * Creates a new type checker scope.
   *
   * @param parent - Optional enclosing scope; its imports are visible from this scope.
   * @param namespace - The namespace the elements declared in this scope are created in, when it differs from the one
   *   of the enclosing scope, i.e. for the children of an `<svg>`, a `<math>` or a `<foreignObject>` element.
   */
  constructor(parent?: TypeCheckContext, namespace?: ElementNamespace) {
    super(parent, namespace);
  }
  
  /**
   * Adds a new component or directive import to the type checker context.
   *
   * @param value - The component or directive import metadata to be added
   */
  public addImport(...value: ComponentOrDirectiveMetadata[]): void {
    this._imports.push(...value);
  }

  /**
   * Registers a template declared in this scope (see {@link CompilerContext.addTemplate}), recording in the outermost
   * scope that the type-check code reads the template helpers.
   *
   * @param name - The name of the template.
   * @param namespace - The namespace the content of the template is created in.
   */
  public override addTemplate(name: string, namespace: ElementNamespace): void {
    super.addTemplate(name, namespace);
    this.recordTemplateHelpers();
  }

  /**
   * Records in the outermost scope that the type-check code reads the template helpers (see {@link usesTemplateHelpers}).
   */
  public recordTemplateHelpers(): void {
    if (this.parent) {
      this.parent.recordTemplateHelpers();
    } else {
      this._usesTemplateHelpers = true;
    }
  }

  /**
   * Records that the type-check code instantiates the generic component of an element in the scope of the template
   * variable naming it, i.e. that the element was type-checked.
   *
   * @param position - The position of the element in the template.
   */
  public addInstantiation(position: number): void {
    if (this.parent) {
      this.parent.addInstantiation(position);
    } else {
      this._instantiations.add(position);
    }
  }

  /**
   * Tells whether the type-check code instantiates the generic component of an element in the scope of the template
   * variable naming it (see {@link addInstantiation}).
   *
   * @param position - The position of the element in the template.
   * @returns `true` if the instantiation is written, `false` otherwise.
   */
  public hasInstantiation(position: number): boolean {
    return this.parent ? this.parent.hasInstantiation(position) : this._instantiations.has(position);
  }

  /**
   * Adds the symbols the template imports from modules: the expressions read them as written, since the type-check
   * code imports them under the same name, and an expression reading a reactive one reads a signal.
   *
   * @param symbols - The imported symbols.
   */
  public addSymbolImport(...symbols: readonly SymbolImport[]): void {
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      this._symbols.push(symbol);
      this.addImportedIdentifier(symbol.local, symbol.local, symbol.reactive ? 'signal' : 'value');
    }
  }

  /**
   * Registers a signal called by the conditions of an `@if` chain of this scope, whose value the type-check code holds
   * in a constant: a call of the signal without arguments reads it through the constant (see `narrowedSignal` of
   * `resolveExpression`), so that TypeScript narrows its value in the conditions and in the branches of the chain.
   *
   * @param name - The name of the signal.
   * @param value - The name of the constant holding its value.
   */
  public addNarrowedSignal(name: string, value: string): void {
    this._narrowedSignals.set(name, value);
  }

  /**
   * Returns the constant holding the value of a signal an `@if` chain narrows (see {@link addNarrowedSignal}), looking
   * in this scope first and then in the ancestor scopes: a variable of an inner scope named like the signal hides it.
   *
   * @param name - The name of the signal.
   * @returns The name of the constant, `undefined` if no enclosing `@if` chain narrows the signal.
   */
  public getNarrowedSignal(name: string): string | undefined {
    return this.declaresIdentifier(name) ? undefined : this._narrowedSignals.get(name) ?? this.parent?.getNarrowedSignal(name);
  }

  /**
   * Finds the symbol an `@import` specifier imports, looking in this scope first and then in the ancestor scopes.
   *
   * @param specifier - The specifier.
   * @returns The imported symbol, `undefined` if the specifier imports a component or a directive, or could not be resolved.
   */
  public getSymbolImport(specifier: ImportSpecifier): SymbolImport | undefined {
    return this._symbols.find(({ importedSpan }) => importedSpan.start === specifier.importedSpan.start) ?? this.parent?.getSymbolImport(specifier);
  }

  /**
   * Finds the component registered for the given selector, looking in this
   * scope first and then in the ancestor scopes.
   *
   * @param tagName - The tag name to look up.
   * @returns The matching component metadata, if any.
   */
  public getImportBySelector(tagName: string): ComponentMetadata | undefined {
    return this._imports.find((importValue): importValue is ComponentMetadata => importValue.type === 'component' && importValue.selector === tagName)
      ?? this.parent?.getImportBySelector(tagName);
  }

  /**
   * Finds the directive registered for the given selector, looking in this
   * scope first and then in the ancestor scopes.
   *
   * @param selector - The directive selector to look up.
   * @returns The matching directive metadata, if any.
   */
  public getDirectiveBySelector(selector: string): DirectiveMetadata | undefined {
    return this._imports.find((importValue): importValue is DirectiveMetadata => importValue.type === 'directive' && importValue.selector === selector)
      ?? this.parent?.getDirectiveBySelector(selector);
  }
}