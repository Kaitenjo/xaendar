import type { ComponentMetadata } from './component-metadata/component-metadata.type';
import type { ClassDeclarationWithName, DirectiveDecorator } from './typescript-decorator-nodes.type';

/**
 * Metadata for a directive extracted from the @Directive decorator, derived from component metadata by omitting component-specific properties.
 */
export type DirectiveMetadata = Omit<ComponentMetadata, 'type' | 'styleUrl' | 'templateUrl' | 'typescriptNodes'> & {
  /**
   * The type identifier for directive metadata.
   */
  type: 'directive';
  /**
   * The type parameters of the directive class, if it is generic. The types of its properties and events are written in
   * terms of them, so that the type-check declares them as the type arguments the template passes.
   */
  typeParameters?: DirectiveTypeParameter[];
  /**
   * TypeScript AST nodes related to the directive, including the class declaration and its decorator.
   */
  typescriptNodes: DirectiveDeclaration;
};

/**
 * A type parameter of the class of a directive.
 */
export type DirectiveTypeParameter = {
  /**
   * The name of the type parameter.
   */
  name: string;
  /**
   * Whether it has a default type (`T = string`), which a template that passes no type argument for it gets.
   */
  hasDefault: boolean;
};

/**
 * Represents a class declaration and its associated `Directive` decorator.
 */
export type DirectiveDeclaration = {
  /**
   * The class declaration of the directive.
   */
  klass: ClassDeclarationWithName;
  /**
   * The `Directive` decorator associated with the class.
   */
  decorator: DirectiveDecorator;
};
