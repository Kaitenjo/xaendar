import type { Expression } from 'typescript';
import type { Span } from '../../../types/span.type';
import type { ASTNodeWithSpan } from '../ast-node-with-span.type';
import type { ASTNodeType } from '../node.enum';

/**
 * AST node representing the render of a template, e.g. `@render row(item, $index)`: it renders an instance of the
 * template where it is written. What it calls is the name of a template the scope declares, or an expression whose
 * value is a template (a `TemplateRef`), e.g. `row()` in `@render row()(item)`, or the name of a variable or a member
 * holding one.
 */
export type RenderNode = ASTNodeWithSpan<{
  /**
   * Discriminant identifying this node as the render of a template.
   */
  type: ASTNodeType.Render;
  /**
   * What the `@render` calls, as written: the name of a template, e.g. `row`, or an expression, e.g. `row()`.
   */
  callee: string;
  /**
   * Span of what the `@render` calls.
   */
  calleeSpan: Span;
  /**
   * What the `@render` calls, validated as a template expression: an identifier for a name.
   */
  calleeExpression: Expression;
  /**
   * The arguments of the call, one for each parameter of the template.
   */
  arguments: readonly Expression[];
}>
