import type { ComponentPropertyMetadata } from '../../type-checker/models/component-property-metadata/component-property-metadata.model';
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
  decorator: WebComponentDecorator;
};

