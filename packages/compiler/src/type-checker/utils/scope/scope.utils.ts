import type { ASTNode } from '../../../parser/types/ast.type';
import type { IdentifierKind } from '../../../generator/models/compiler-context/compiler-context.model';
import { resolveExpression, ROOT_NODE } from '../../../generator/utils/generator/generator.utils';
import type { ElementNode } from '../../../parser/types/nodes/element-node.type';
import type { LetNode } from '../../../parser/types/nodes/let-node.type';
import type { TemplateNode } from '../../../parser/types/nodes/template-node.type';
import { visitScopeDeclarations } from '../../../parser/utils/scope-declarations/scope-declarations.utils';
import type { ElementNamespace } from '../../../types/element-namespace/element-namespace.type';
import { getAccessorOwnerType } from '../../../utils/metadata/metadata.utils';
import type { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import type { Line } from '../../types/generated-line.type';
import type { ProcessNode } from '../../types/type-checker-process-node.type';
import { line, mapped, plain } from '../line-builder/line-builder.utils';
import { getElementType } from '../namespace-types/namespace-types.utils';
import { getContentFunction, getLetValue, getParametersType, TEMPLATE } from '../template-types/template-types.utils';

/**
 * The class of a generic component or directive instantiated with the types of its type parameters, that the types of
 * its properties and events are written in terms of.
 */
export const INSTANCE = '__Instance';

/**
 * Returns the suffix of the names of the declarations instantiating the generic component of an element named by a
 * element ref: they are written in the scope of the ref, which is typed with the instantiation, instead of
 * in a block around the checks of the element, so they are told apart by the position of the element.
 *
 * @param element - The element.
 * @returns The suffix.
 */
export function getInstantiationSuffix(element: Pick<ElementNode, 'span'>): string {
  return `${element.span.start}`;
}

/**
 * Type-checks the nodes of a scope in its context, together with the declarations of the element refs, of the
 * templates and of the `@let` it declares, which the expressions and the `@render`s of the whole scope read as written,
 * the ones written before their declaration too. The names are registered in the context before the nodes are checked,
 * and declared once they are, when it is known whether the generic components the variables name were instantiated. A
 * name declared twice in the scope is registered once: TypeScript reports both its declarations.
 *
 * The `@let` are registered after the other names, in the order they are written, as signals when their value reads one,
 * as the render code does: the value of one tells whether it reads the signal of another one written before it. A
 * `@let` is typed with the constant its value is checked in, where it is written (see `typeCheckLet`).
 *
 * @param nodes - The nodes of the scope.
 * @param context - The context of the scope.
 * @param processNode - Type-checks a node.
 * @returns The declarations of the names, to write at the start of the block of the scope, and the lines of the nodes.
 */
export function typeCheckScope(nodes: readonly ASTNode[], context: TypeCheckContext, processNode: ProcessNode): { declarations: Line[], lines: Line[] } {
  const register = (name: string, kind: IdentifierKind = 'value'): void => {
    if (!context.declaresIdentifier(name)) {
      context.addUnresolvableIdentifier(name, kind);
    }
  };

  const lets = new Array<LetNode>();
  visitScopeDeclarations(nodes, context.namespace, {
    ref: (_element, { name }) => register(name),
    template: ({ declaration: { name } }, namespace) => {
      register(name);
      context.addTemplate(name, namespace);
    },
    let: node => lets.push(node)
  });

  for (let i = 0; i < lets.length; i++) {
    const { name, value } = lets[i];
    register(name, resolveExpression(value, context, { resolver: ROOT_NODE }).reactive ? 'signal' : 'value');
  }

  const lines = nodes.flatMap(node => processNode(node, context));
  const declarations = new Array<Line>();
  visitScopeDeclarations(nodes, context.namespace, {
    ref: (element, { name, nameSpan }, namespace) => {
      declarations.push(line('let ', mapped(name, nameSpan), `!: ${getVariableType(element, namespace, context)};`));
    },
    template: template => declarations.push(...declareTemplate(template)),
    let: node => declarations.push(line('let ', mapped(node.name, node.nameSpan), `!: typeof ${getLetValue(node)};`))
  });

  return { declarations, lines };
}

/**
 * Declares a template: the labeled tuple of the parameters of the function its content is type-checked in (see
 * `typeCheckTemplate`), where their types are mapped onto the template and the ones of the parameters typed by their
 * default value are inferred, and the variable holding the template, typed with it.
 *
 * @example
 * // <template row(item: Item, index: number)>
 * type __Params12 = Parameters<typeof __template12>;
 * let row!: __Template<__Params12>;
 *
 * @param template - The template.
 * @returns The lines declaring the template.
 */
function declareTemplate({ declaration: { name, nameSpan }, span }: TemplateNode): Line[] {
  const parametersType = getParametersType({ span });
  return [
    plain(`type ${parametersType} = Parameters<typeof ${getContentFunction({ span })}>;`),
    line('let ', mapped(name, nameSpan), `!: ${TEMPLATE}<${parametersType}>;`)
  ];
}

/**
 * Returns the type of the element ref naming an element: the type the DOM declares for a native element (or a
 * custom element of another library), the class of a component, instantiated with the types of its type parameters when
 * it is generic, or `any` when the element failed type-checking before its generic component was instantiated.
 *
 * @param element - The element.
 * @param namespace - The namespace the element is created in.
 * @param context - The context of the scope of the variable.
 * @returns The type of the variable.
 */
function getVariableType(element: ElementNode, namespace: ElementNamespace, context: TypeCheckContext): string {
  const component = context.getImportBySelector(element.tagName);
  if (!component) {
    return getElementType(namespace, element.tagName);
  }

  if (!component.typeParameters) {
    const { klass } = component.typescriptNodes;
    return getAccessorOwnerType(klass, klass.getSourceFile(), false);
  }

  return context.hasInstantiation(element.span.start) ? `${INSTANCE}${getInstantiationSuffix(element)}` : 'any';
}
