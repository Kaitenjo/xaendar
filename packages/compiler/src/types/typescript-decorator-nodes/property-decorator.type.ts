import type { Decorator, CallExpression, Expression, PropertyDeclaration } from 'typescript';

/**
 * TypeScript node of a `@Property(...)` decorator applied to a property declaration.
 */
export type PropertyDecorator = Omit<Decorator, 'expression' | 'parent'> & {
  expression: Omit<CallExpression, 'expression'> & {
    expression: Omit<Expression, 'text'> & { text: 'Property' }
  },
  parent: PropertyDeclaration
};
