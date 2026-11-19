import type { Decorator, CallExpression, Expression } from 'typescript';
import type { ClassDeclarationWithName } from './class-declaration-with-name.type';

/**
 * TypeScript node of a `@Directive(...)` decorator applied to a named class.
 */
export type DirectiveDecorator = Omit<Decorator, 'expression' | 'parent'> & {
  expression: Omit<CallExpression, 'expression'> & {
    expression: Omit<Expression, 'text'> & { text: 'Directive' }
  },
  parent: ClassDeclarationWithName
};
