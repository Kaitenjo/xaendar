import type { ComponentPropertyMetadata } from '../type-checker/models/component-property-metadata/component-property-metadata.model';
import type { ClassTypeParameter } from './class-type-parameter.type';
import type { ComponentEventMetadata } from './component-event-metadata.type';
import type { ComponentDeclaration } from './component-declaration.type';

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
