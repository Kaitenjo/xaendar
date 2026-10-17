import type { TemplateNode } from '../../../parser/types/nodes/template-node.type';
import { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import type { Line } from '../../types/generated-line.type';
import type { ProcessNode } from '../../types/type-checker-process-node.type';
import { indentLines, line, type LinePart, mapped, plain } from '../../utils/line-builder/line-builder.utils';
import { typeCheckScope } from '../../utils/scope/scope.utils';
import { getParametersType, PARAMETERS } from '../../utils/template-types/template-types.utils';

/**
 * Type-checks the content of a template in an arrow function, declared where the template is: its body is a scope of
 * its own, nested in the one declaring the template, whose names it reads, and its parameters are the signals of the
 * types the template declares (see `typeCheckScope`, declaring the template at the start of its scope).
 *
 * @example
 * // <template #row(item: Item, index: number)>…</template>
 * ((...[item, index]: __Parameters<__Params12>) => {
 *   …
 * });
 *
 * @param node - The `TemplateNode` to type-check.
 * @param processNode - Callback emitting the lines of each child node.
 * @param context - The enclosing type-check scope.
 * @returns The lines of the arrow function.
 */
export function typeCheckTemplate(node: TemplateNode, processNode: ProcessNode, context: TypeCheckContext): Line[] {
  const templateContext = new TypeCheckContext(context);
  const { parameters } = node;
  const names = new Array<LinePart>();
  for (let i = 0; i < parameters.length; i++) {
    const { name, nameSpan } = parameters[i];
    templateContext.addUnresolvableIdentifier(name, 'signal');
    names.push(i ? ', ' : '', mapped(name, nameSpan));
  }

  const { declarations, lines } = typeCheckScope(node.children, templateContext, processNode);
  return [
    parameters.length ? line('((...[', ...names, `]: ${PARAMETERS}<${getParametersType(node)}>) => {`) : plain('(() => {'),
    ...indentLines(declarations.concat(lines)),
    plain('});')
  ];
}
