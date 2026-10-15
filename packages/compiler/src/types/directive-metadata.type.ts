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
   * TypeScript AST nodes related to the directive, including the class declaration and its decorator.
   */
  typescriptNodes: DirectiveDeclaration;
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
