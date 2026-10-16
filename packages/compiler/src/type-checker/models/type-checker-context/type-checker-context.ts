import { CompilerContext } from '../../../generator/models/compiler-context/compiler-context.model';
import { ComponentMetadata } from '../../../types/component-metadata/component-metadata.type';
import { ComponentOrDirectiveMetadata } from '../../../types/component-or-directive-metadata.type';
import { DirectiveMetadata } from '../../../types/directive-metadata.type';
import type { ImportSpecifier } from '../../../parser/types/nodes/import-specifier.type';
import type { SymbolImport } from '../../../types/imported-symbol/imported-symbol.type';
import type { ElementEventMap } from '../../types/element-event-map.type';

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
   * Creates a new type checker scope.
   *
   * @param parent - Optional enclosing scope; its imports are visible from this scope.
   * @param _eventMap - Event map of the elements declared in this scope, when it differs from the one of the
   *   enclosing scope, i.e. for the children of an `<svg>` or a `<math>` element.
   */
  constructor(
    parent?: TypeCheckContext, 
    private readonly _eventMap?: ElementEventMap
  ) {
    super(parent);
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
   * Adds the symbols the template imports from modules: the expressions read them as written, since the type-check
   * code imports them under the same name.
   *
   * @param symbols - The imported symbols.
   */
  public addSymbolImport(...symbols: readonly SymbolImport[]): void {
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      this._symbols.push(symbol);
      this.addImportedIdentifier(symbol.local, symbol.local);
    }
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
   * Returns the event map of the elements declared in this scope, looking in this
   * scope first and then in the ancestor scopes.
   *
   * @returns The event map of the closest scope declaring one, `HTMLElementEventMap` if none does.
   */
  public get eventMap(): ElementEventMap {
    return this._eventMap ?? this.parent?.eventMap ?? 'HTMLElementEventMap';
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