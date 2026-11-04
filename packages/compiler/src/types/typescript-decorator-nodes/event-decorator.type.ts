import type { Decorator, CallExpression, Expression, PropertyDeclaration } from 'typescript';

/**
 * TypeScript node of an `@Event(...)` decorator applied to a property declaration.
 */
export type EventDecorator = Omit<Decorator, 'expression' | 'parent'> & {
  expression: Omit<CallExpression, 'expression'> & {
    expression: Omit<Expression, 'text'> & { text: 'Event' }
  },
  parent: PropertyDeclaration
};
