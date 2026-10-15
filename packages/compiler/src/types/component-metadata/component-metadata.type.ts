import type { ComponentPropertyMetadata } from '../../type-checker/models/component-property-metadata/component-property-metadata.model';
import type { MemberDeclaration } from '../member-declaration/member-declaration.type';
import type { ClassDeclarationWithName, WebComponentDecorator } from '../typescript-decorator-nodes.type';

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
   * HTML element selector (tag name), unique across every component: a custom element name can be defined only once.
   */
  selector: string;
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
   * The type parameters of the class, if it is generic. The types of its properties and events are written in
   * terms of them, so that the type-check instantiates the class with the types the template gives them.
   */
  typeParameters?: ClassTypeParameter[];
  /**
   * TypeScript AST nodes related to the component, including the class declaration and its decorator.
   * These nodes are useful for forward operations without needing to re-parse the source file to extract them.
   */
  typescriptNodes: ComponentDeclaration;
};

/**
 * A type parameter of the class of a component or of a directive.
 */
export type ClassTypeParameter = {
  /**
   * The name of the type parameter.
   */
  name: string;
  /**
   * Whether it has a default type (`T = string`), which a template giving it no type gets.
   */
  hasDefault: boolean;
};

/**
 * Represents a component event with metadata from @Event decorator.
 */
export type ComponentEventMetadata = {
  /**
   * Detail type emitted by the event.
   */
  type: string;
  /**
   * Where the `@Event` accessor is declared: in the class itself, or in one of its base classes.
   */
  declaration?: MemberDeclaration;
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
  decorator: WebComponentDecorator;
};

