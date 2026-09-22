import { ClassDeclaration, Decorator } from 'typescript';

/**
 * Metadata for a web component extracted from the @WebComponent decorator.
 */
export type ComponentMetadata = {
  /**
   * The type identifier for component metadata.
   */
  type: 'component';
  /**
   * Component class name.
   */
  className: string;
  /**
   * HTML element selectors (tag names).
   */
  selectors: string[];
  /**
   * URL to the component's style file (CSS or similar).
   */
  styleUrl?: string;
  /**
   * URL to the component's HTML template file 
   */
  templateUrl: string;
  /**
   * Component input properties metadata.
   */
  properties: Map<string, ComponentPropertyMetadata>;
  /**
   * Component output events metadata.
   */
  events: Map<string, ComponentEventMetadata>;
  /**
   * TypeScript AST nodes related to the component, including the class declaration and its decorator.
   * These nodes are useful for forward operations without needing to re-parse the source file to extract them.
   */
  typescriptNodes: ComponentDeclaration;
};

/**
 * Represents a component property with metadata from @Property decorator.
 */
export class ComponentPropertyMetadata {
  /**
   * The default value for the property, if any.
  */
  public alias?: string;
  /**
   * The default value for the property, if any.
   */
  public defaultValue?: unknown;
  /**
   * Indicates whether the property is required.
   */
  public required = false;

  constructor(
    public name: string,
    public type: string,
    public options?: { required?: boolean, alias?: string, defaultValue?: unknown },
  ) {
    if (options) {
      const { required, alias, defaultValue } = options;
      if (required !== undefined) {
        this.required = required;
        if (!required && defaultValue !== undefined) {
          this.defaultValue = defaultValue;
        }
      }
      
      this.alias = alias;
    }
  }

  /**
   * Gets the default value for the property, considering whether it is required.
   * @param required Whether to consider the property as required when getting the default value.
   */
  public getDefaultValue(): unknown;
  public getDefaultValue(required: true): unknown;
  public getDefaultValue(required: false): undefined;
  public getDefaultValue(required?: boolean): unknown {
    return !(required && this.required) ? this.defaultValue : undefined;
  }

  /**
   * Sets the default value for the property.
   * @param value The default value to set for the property.
   * @throws Throws an error if the property is required.
   */
  public setDefaultValue(value: unknown) {
    if (this.required) {
      throw new Error(`Cannot set default value for required property "${this.name}".`);
    }

    this.defaultValue = value;
  }
}

/**
 * Represents a component event with metadata from @Event decorator.
 */
export type ComponentEventMetadata = {
  /**
   * Detail type emitted by the event.
   */
  type: string;
};

/**
 * Represents a class declaration and its associated `WebComponent` decorator.
 */
export type ComponentDeclaration = {
  /**
   * The class declaration of the component.
   */
  klass: ClassDeclarationWithName;
  /**
   * The `WebComponent` decorator associated with the class.
   */
  decorator: Decorator;
};

/**
 * Represents a class declaration that is guaranteed to have a name.
 */
export type ClassDeclarationWithName = Omit<ClassDeclaration, 'name'> & Required<Pick<ClassDeclaration, 'name'>>;