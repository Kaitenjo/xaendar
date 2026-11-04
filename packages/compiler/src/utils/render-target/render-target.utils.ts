import type { ElementNamespace } from '../../types/element-namespace.type';
import type { Span } from '../../types/span.type';

/**
 * The names of the namespaces, as the error messages write them.
 */
const NAMESPACE_NAMES: Readonly<Record<ElementNamespace, string>> = { html: 'HTML', svg: 'SVG', mathml: 'MathML' };

/**
 * Ensures a `@render` renders a template it can render: a name referring to a template, declared in its scope or in an
 * enclosing one, whose content is created in the namespace the `@render` creates its elements in.
 *
 * @param callee - The name the `@render` calls.
 * @param calleeSpan - The span of the name, which the errors point to.
 * @param templateNamespace - The namespace the content of the template is created in, `undefined` if the name doesn't
 *   refer to a template.
 * @param namespace - The namespace the `@render` creates its elements in.
 * @throws If the name doesn't refer to a template, or the template creates its content in another namespace.
 */
export function assertRenderTarget(callee: string, calleeSpan: Span, templateNamespace: ElementNamespace | undefined, namespace: ElementNamespace): void {
  if (!templateNamespace) {
    throw new Error(`"${callee}" is not a template visible here: declare it with <template ${callee}(…)> in this scope or in an enclosing one`, { cause: calleeSpan });
  }

  if (templateNamespace !== namespace) {
    throw new Error(`Template "${callee}" is declared among ${NAMESPACE_NAMES[templateNamespace]} elements, and its content cannot be rendered among ${NAMESPACE_NAMES[namespace]} elements: declare it in the namespace it is rendered in`, { cause: calleeSpan });
  }
}
