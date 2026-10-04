import type { ASTNodeWithSpan } from '../ast.type';
import type { ASTNodeType } from '../node.enum';
import type { DirectiveNode } from './directive-node.type';

/**
 * AST node representing a structural directive applied to an element, deciding whether the element is rendered at all,
 * e.g. `*hasRole(role="admin")`.
 *
 * Unlike a directive, it only binds its properties: it listens to no event, since it holds no element to dispatch
 * them on, and its properties cannot be bound conditionally.
 */
export type StructuralDirectiveNode = ASTNodeWithSpan<Pick<DirectiveNode, 'selector' | 'attributes'> & {
  /**
   * Discriminant identifying this node as a structural directive.
   */
  type: ASTNodeType.StructuralDirective
}>
