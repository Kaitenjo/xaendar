import { isIdentifier } from 'typescript';
import type { RenderNode } from '../../parser/types/nodes/render-node.type';
import type { ElementNamespace } from '../../types/element-namespace.type';
import type { Function } from '@xaendar/types';

/**
 * The names of the namespaces, as the error messages write them.
 */
const NAMESPACE_NAMES: Readonly<Record<ElementNamespace, string>> = { html: 'HTML', svg: 'SVG', mathml: 'MathML' };

/**
 * Tells which template a `@render` renders by name: the name it calls, when it refers to a template declared in its
 * scope or in an enclosing one, whose content must be created in the namespace the `@render` creates its elements in.
 * Any other `@render` calls an expression whose value is a template (`@render rowTemplate()(item)`, or the name of a
 * variable or of a member holding one), rendered whatever it is.
 *
 * @param node - The `@render`.
 * @param getTemplateNamespace - Returns the namespace the content of the template a name refers to is created in,
 *   `undefined` if the name doesn't refer to a template.
 * @param namespace - The namespace the `@render` creates its elements in.
 * @returns The name of the template, `undefined` when the `@render` calls an expression.
 * @throws If the template creates its content in another namespace.
 */
export function getRenderedTemplate(node: Pick<RenderNode, 'callee' | 'calleeSpan' | 'calleeExpression'>, getTemplateNamespace: Function<[name: string], ElementNamespace | undefined>, namespace: ElementNamespace): string | undefined {
  const { callee, calleeSpan } = node;
  const templateNamespace = isIdentifier(node.calleeExpression) ? getTemplateNamespace(callee) : undefined;
  if (!templateNamespace) {
    return undefined;
  }

  if (templateNamespace !== namespace) {
    throw new Error(`Template "${callee}" is declared among ${NAMESPACE_NAMES[templateNamespace]} elements, and its content cannot be rendered among ${NAMESPACE_NAMES[namespace]} elements: declare it in the namespace it is rendered in`, { cause: calleeSpan });
  }

  return callee;
}
