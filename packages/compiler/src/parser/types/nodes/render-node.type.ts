import type { Expression } from 'typescript';
import type { Span } from '../../../types/span.type';
import type { ASTNodeWithSpan } from '../ast-node-with-span.type';
import type { ASTNodeType } from '../node.enum';

/**
 * AST node representing the render of a template, e.g. `@render row(item(), $index())`: it renders an instance of the
 * template where it is written.
 */
export type RenderNode = ASTNodeWithSpan<{
  /**
   * Discriminant identifying this node as the render of a template.
   */
  type: ASTNodeType.Render;
  /**
   * The name of the template.
   */
  callee: string;
  /**
   * Span of the name of the template.
   */
  calleeSpan: Span;
  /**
   * The arguments of the call, one for each parameter of the template.
   */
  arguments: readonly Expression[];
}>
