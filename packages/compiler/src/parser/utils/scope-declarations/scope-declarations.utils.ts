import type { VoidFunction } from '@xaendar/types';
import type { ElementNamespace } from '../../../types/element-namespace/element-namespace.type';
import { getChildrenNamespace, getElementNamespace } from '../../../utils/element-namespace/element-namespace.utils';
import type { ASTNode } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import type { ConditionalBindingBranchNode } from '../../types/nodes/conditional-binding-branch-node.type';
import type { ConditionalBindingNode } from '../../types/nodes/conditional-binding-node.type';
import type { ElementNode } from '../../types/nodes/element-node.type';
import type { LetNode } from '../../types/nodes/let-node.type';
import type { TemplateNode } from '../../types/nodes/template-node.type';
import type { ElementRefNode } from '../../types/nodes/element-ref-node.type';

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

/**
 * Visits the names a scope of a template declares, in the order they are written, which are visible in the whole of it,
 * before their declaration too: the element refs of its elements, its templates and its `@let`s, however deeply
 * nested, since an element doesn't open a scope. A control-flow block, the content of an element a structural directive is applied to and the content of a
 * template are scopes of their own, whose declarations are not visited.
 *
 * @example
 * // Visits #name, declared inside the <label>, but not #inner, declared in the scope of the @if
 * visitScopeDeclarations(parseTemplate('<label><input #name /></label> @if (open()) { <input #inner /> }'), 'html', visitor);
 *
 * @param nodes - The nodes of the scope.
 * @param namespace - The namespace the nodes of the scope are created in.
 * @param visitor - The callbacks to invoke.
 */
export function visitScopeDeclarations(nodes: readonly ASTNode[], namespace: ElementNamespace, visitor: ScopeDeclarationVisitor): void {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    switch (node.type) {
      case ASTNodeType.Element: {
        const elementNamespace = getElementNamespace(node.tagName, namespace);
        if (node.ref) {
          visitor.ref?.(node, node.ref, elementNamespace);
        }

        if (!isStructuralElement(node)) {
          visitScopeDeclarations(node.children, getChildrenNamespace(node.tagName, elementNamespace), visitor);
        }
        break;
      }

      case ASTNodeType.Template:
        visitor.template?.(node, namespace);
        break;

      case ASTNodeType.Let:
        visitor.let?.(node);
        break;
    }
  }
}

/**
 * Tells whether a structural directive is applied to an element, directly or by one of its conditional bindings: the
 * element may then not be rendered, and its content is a scope of its own, created and destroyed with it.
 *
 * @param element - The structural directives and the conditional bindings of the element, or of a branch of one of them.
 * @returns `true` if a structural directive is applied, `false` otherwise.
 */
export function isStructuralElement({ structuralDirectives, conditionalBindings }: Pick<ConditionalBindingBranchNode, 'structuralDirectives' | 'conditionalBindings'>): boolean {
  return !!structuralDirectives.length || conditionalBindings.some(appliesStructuralDirectives);
}

/**
 * Tells whether a conditional binding applies a structural directive, in one of its branches or in the conditional
 * bindings nested in them.
 *
 * @param conditionalBinding - The conditional binding.
 * @returns `true` if it applies a structural directive, `false` otherwise.
 */
function appliesStructuralDirectives({ branches }: ConditionalBindingNode): boolean {
  return branches.some(isStructuralElement);
}
