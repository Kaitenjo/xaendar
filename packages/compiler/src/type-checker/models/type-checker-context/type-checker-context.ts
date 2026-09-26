import { CompilerContext } from '../../../generator/models/compiler-context/compiler-context.model';
import { ComponentMetadata } from '../../../types/component-metadata/component-metadata.type';
import { ComponentOrDirectiveMetadata } from '../../../types/component-or-directive-metadata.type';

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
   * Adds a new component or directive import to the type checker context.
   *
   * @param value - The component or directive import metadata to be added
   */
  public addImport(...value: ComponentOrDirectiveMetadata[]): void {
    this._imports.push(...value);
  }

  /**
   * Creates a new type checker scope.
   *
   * @param parent - Optional enclosing scope; its imports are visible from this scope.
   * @param identifiers - Named identifier bindings declared in this scope.
   */
  constructor(parent?: TypeCheckContext, identifiers?: ConstructorParameters<typeof CompilerContext>[1]) {
    super(parent, identifiers);
  }

  /**
   * Finds the component registered for the given selector, looking in this
   * scope first and then in the ancestor scopes.
   *
   * @param tagName - The tag name to look up.
   * @returns The matching component metadata, if any.
   */
  public getImportBySelector(tagName: string): ComponentMetadata | undefined {
    return this._imports.find((importValue): importValue is ComponentMetadata => importValue.type === 'component' && importValue.selectors.includes(tagName))
      ?? this.parent?.getImportBySelector(tagName);
  }
}