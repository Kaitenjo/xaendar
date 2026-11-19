import type { TemplateNode } from '../../../parser/types/nodes/template-node.type';
import type { TemplateParameterNode } from '../../../parser/types/nodes/template-parameter-node.type';
import { getTemplateSpan } from '../../../parser/utils/expression-validator/expression-validator';
import { TypeCheckContext } from '../../models/context/context';
import type { Line } from '../../types/line.type';
import type { ProcessNode } from '../../types/type-checker-process-node.type';
import { indentLines, line, mapped, plain } from '../../utils/line-builder/line-builder.utils';
import type { LinePart } from '../../types/line-part.type';
import { mappedExpression } from '../../utils/mapped-expression/mapped-expression.utils';
import { typeCheckScope } from '../../utils/scope/scope.utils';
import { getContentFunction } from '../../utils/template-types/template-types.utils';

/**
 * Type-checks the content of a template in an arrow function, declared where the template is: its body is a scope of
 * its own, nested in the one declaring the template, whose names it reads, and its parameters are the ones of the
 * template, written as declared: the values the content reads. The declaration of the template reads the parameters of
 * the function (see `typeCheckScope`, declaring the template at the start of its scope), so that a parameter whose
 * argument may be left out is optional, and the type of a parameter typed by its default value is the one TypeScript
 * infers. A default value is checked as in JavaScript: it reads the names the content reads, and the parameters before
 * it.
 *
 * @example
 * // <template row(item: Item, dense: boolean = false, count?: number)>…</template>
 * const __template12 = (item: Item, dense: boolean = false, count?: number): void => {
 *   …
 * };
 *
 * @param node - The `TemplateNode` to type-check.
 * @param processNode - Callback emitting the lines of each child node.
 * @param context - The enclosing type-check scope.
 * @returns The lines of the arrow function.
 */
export function typeCheckTemplate(node: TemplateNode, processNode: ProcessNode, context: TypeCheckContext): Line[] {
  const templateContext = new TypeCheckContext(context);
  const { parameters } = node;
  for (let i = 0; i < parameters.length; i++) {
    templateContext.addUnresolvableIdentifier(parameters[i].name, 'variable');
  }

  const parts: LinePart[] = [`const ${getContentFunction(node)} = (`];
  for (let i = 0; i < parameters.length; i++) {
    if (i) {
      parts.push(', ');
    }

    typeCheckParameter(parameters[i], templateContext, parts);
  }

  parts.push('): void => {');
  const { declarations, lines } = typeCheckScope(node.children, templateContext, processNode);
  return [
    line(...parts),
    ...indentLines(declarations.concat(lines)),
    plain('};')
  ];
}

/**
 * Writes a parameter of the function a template is type-checked in, as declared: its name, `?` when it is optional,
 * its type, if any, and its default value, if any.
 *
 * @param parameter - The parameter.
 * @param context - The scope of the content of the template.
 * @param parts - The parts of the line the parameter is written to: its name and its type mapped onto the template, and
 *   its default value mapped as an expression.
 */
function typeCheckParameter({ name, nameSpan, type, typeSpan, optional, initializer }: TemplateParameterNode, context: TypeCheckContext, parts: LinePart[]): void {
  parts.push(mapped(name, nameSpan));
  if (optional) {
    parts.push('?');
  }

  if (type && typeSpan) {
    parts.push(': ', mapped(type, typeSpan));
  }

  if (initializer) {
    parts.push(' = ', mappedExpression(initializer, context, getTemplateSpan(initializer)!));
  }
}
