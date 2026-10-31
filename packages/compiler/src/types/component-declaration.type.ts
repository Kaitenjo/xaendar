import type { WebComponentDecorator } from './typescript-decorator-nodes/web-component-decorator.type';
import type { ClassDeclarationWithName } from './typescript-decorator-nodes/class-declaration-with-name.type';

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
