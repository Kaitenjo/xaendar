import type { Decorator, CallExpression, Expression, PropertyDeclaration } from 'typescript';

/**
 * TypeScript node of a `@Property(...)` or `@Model(...)` decorator applied to a property declaration, its `required` variant included.
 */
export type PropertyDecorator = Omit<Decorator, 'expression' | 'parent'> & {
  expression: Omit<CallExpression, 'expression'> & {
    expression: Omit<Expression, 'text'> & { text: 'Property' | 'Model' }
  },
  parent: PropertyDeclaration
};
