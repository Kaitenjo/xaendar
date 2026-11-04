import type { DirectiveDecorator } from './typescript-decorator-nodes/directive-decorator.type';
import type { ClassDeclarationWithName } from './typescript-decorator-nodes/class-declaration-with-name.type';

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
