import type { ComponentMetadata } from './component-metadata.type';
import type { DirectiveDeclaration } from './directive-declaration.type';

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
