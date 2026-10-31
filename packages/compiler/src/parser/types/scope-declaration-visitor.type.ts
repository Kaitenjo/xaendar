import type { VoidFunction } from '@xaendar/types';
import type { ElementNamespace } from '../../types/element-namespace.type';
import type { ElementNode } from './nodes/element-node.type';
import type { LetNode } from './nodes/let-node.type';
import type { TemplateNode } from './nodes/template-node.type';
import type { ElementRefNode } from './nodes/element-ref-node.type';

/**
 * Callbacks invoked by {@link visitScopeDeclarations} for the names a scope of a template declares. Every callback is optional.
 */
export type ScopeDeclarationVisitor = {
  /**
   * Invoked for every element of the scope naming itself with an element ref, with the namespace it is created in.
   */
  readonly ref?: VoidFunction<[element: ElementNode, ref: ElementRefNode, namespace: ElementNamespace]>;
  /**
   * Invoked for every template the scope declares, with the namespace its content is created in.
   */
  readonly template?: VoidFunction<[template: TemplateNode, namespace: ElementNamespace]>;
  /**
   * Invoked for every `@let` of the scope.
   */
  readonly let?: VoidFunction<[node: LetNode]>;
};
