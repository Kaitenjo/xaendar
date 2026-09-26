import { CallExpression, ClassDeclaration, Decorator, Expression, PropertyDeclaration } from 'typescript';

/**
 * Represents a class declaration that is guaranteed to have a name.
 */
export type ClassDeclarationWithName = Omit<ClassDeclaration, 'name'> & Required<Pick<ClassDeclaration, 'name'>>;

/**
 * TypeScript node of a `@WebComponent(...)` decorator applied to a named class.
 */
export type WebComponentDecorator = Omit<Decorator, 'expression' | 'parent'> & {
  expression: Omit<CallExpression, 'expression'> & {
    expression: Omit<Expression, 'text'> & { text: 'WebComponent' }
  },
  parent: ClassDeclarationWithName
};

/**
 * TypeScript node of a `@Property(...)` decorator applied to a property declaration.
 */
export type PropertyDecorator = Omit<Decorator, 'expression' | 'parent'> & {
  expression: Omit<CallExpression, 'expression'> & {
    expression: Omit<Expression, 'text'> & { text: 'Property' }
  },
  parent: PropertyDeclaration
};

/**
 * TypeScript node of an `@Event(...)` decorator applied to a property declaration.
 */
export type EventDecorator = Omit<Decorator, 'expression' | 'parent'> & {
  expression: Omit<CallExpression, 'expression'> & {
    expression: Omit<Expression, 'text'> & { text: 'Event' }
  },
  parent: PropertyDeclaration
};
