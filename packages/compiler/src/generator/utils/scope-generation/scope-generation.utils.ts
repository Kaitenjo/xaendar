import type { ASTNode } from '../../../parser/types/ast.type';
import type { LetNode } from '../../../parser/types/nodes/let-node.type';
import type { TemplateNode } from '../../../parser/types/nodes/template-node.type';
import type { ElementNamespace } from '../../../types/element-namespace.type';
import { visitScopeDeclarations } from '../../../parser/utils/scope-declarations/scope-declarations.utils';
import { GeneratorContext } from '../../context/context';
import type { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import type { ResolveExpressionOptions } from '../../types/resolve-expresion-options.type';
import { isConstantExpression, resolveExpression } from '../generator/generator.utils';
import type { TemplateFunctionFactory } from '../../types/template-function-factory.type';
import { declareLetBinding, toArrayLiteral, toObjectLiteral, toRoleName } from '../module-code/module-code.utils';

/**
 * Declares the element refs, the templates and the `@let` of a scope: registers them in its generator context, so
 * that every expression and every `@render` of the scope reads them, the ones written before their declaration too, and
 * writes the code declaring them in its runtime scope:
 * - an element ref takes a slot, declared uninitialized (`_declare`), and the element it names initializes it once
 *   rendered;
 * - a template takes no slot: it is read as a constant of the module, on the client the one describing it
 *   (`template_row_12$template`, see `_Template` of the runtime), naming the function rendering its content (see
 *   `toTemplateFunction`) and the identifiers of its parameters, on the server the function alone. A `@render` finds
 *   the scope declaring it, whose variables its content reads, by how many scopes up it is;
 * - a `@let` takes a slot, declared uninitialized, and initialized once the render reaches it (see `generateLet`): it
 *   is a variable of the template, whose value the runtime computes again, unless its value is a literal, which never
 *   changes.
 *
 * @param nodes - The nodes of the scope.
 * @param generatorContext - The generator context of the scope.
 * @param toTemplateFunction - Describes the function rendering an instance of a template of the scope.
 * @param server - Whether the code renders on the server, which renders every instance of a template once, so the value
 *   of a template is the function rendering it, without the identifiers of the parameters the client updates an
 *   instance by.
 * @returns The code declaring the names, and the functions rendering the content of the templates, `undefined` if the
 *   scope declares none.
 */
export function declareScope(nodes: readonly ASTNode[], generatorContext: GeneratorContext, toTemplateFunction: TemplateFunctionFactory, server = false): Required<GeneratorTransitionFunctionReturnType> | undefined {
  const declarations: Required<GeneratorTransitionFunctionReturnType> = { code: [], functionsToProcess: new Map() };
  const lets = new Array<LetNode>();
  const templates = new Array<{ template: TemplateNode, key: string, namespace: ElementNamespace }>();
  visitScopeDeclarations(nodes, generatorContext.namespace, {
    let: node => lets.push(node),
    ref: (_element, { name }) => {
      generatorContext.addIdentifier(name, 'value');
      declarations.code.push(`_declare(context, ${generatorContext.addressOf(name)!.slot});`);
    },
    template: (template, namespace) => {
      const { name } = template.declaration;
      const key = `template_${name}_${template.span.start}`;
      generatorContext.addIdentifier(name, 'template', server ? key : `${key}$template`);
      generatorContext.addTemplate(name, namespace);
      templates.push({ template, key, namespace });
    }
  });

  for (let i = 0; i < lets.length; i++) {
    const { name, value } = lets[i];
    generatorContext.addIdentifier(name, isConstantExpression(value) ? 'value' : 'variable');
    declarations.code.push(`_declare(context, ${generatorContext.addressOf(name)!.slot}, 'let');`);
  }

  // Described once every name of the scope is registered: the default values of the parameters read them, the @let too
  for (let i = 0; i < templates.length; i++) {
    const { template, key, namespace } = templates[i];
    const fn = toTemplateFunction(template, key, namespace, generatorContext);
    declarations.functionsToProcess.set(key, fn);
    // The parameters are the first variables of the content, declared by the function describing it
    if (!server) {
      const parameters = template.parameters.map(parameter => `${fn.fn.context.idOf(parameter.name)}`);
      generatorContext.declareConstant(`${key}$template`, toObjectLiteral([`render: ${key}`, `parameters: ${toArrayLiteral(parameters)}`]));
    }
  }

  return declarations.code.length || declarations.functionsToProcess.size ? declarations : undefined;
}

/**
 * Declares the parameters of a template in the generator context of the content of an instance, as variables of the
 * template read like the item of a `@for`, the first ones of its runtime scope, and writes the code writing them in it:
 * the values the function rendering the instance receives as `params`. A parameter whose argument the `@render` leaves
 * out holds its default value, which reads the parameters before it, or `undefined`.
 *
 * On the client the default value is computed as the value of a `@let` (`_parameter`), a function of the module named
 * after the template and the parameter (`template_row_12$label`), again when a signal or another parameter it reads
 * changes, while the server, which reads every value once, writes it as an expression.
 *
 * @param template - The template.
 * @param key - The name of the function rendering an instance of the template, which the functions of the default values
 *   are named after.
 * @param context - The generator context of the content of the instance.
 * @param options - The options resolving the default values of the parameters.
 * @param server - Whether the code renders on the server.
 * @returns The lines of code writing the parameters into the runtime scope of the instance.
 */
export function declareTemplateParameters({ parameters }: TemplateNode, key: string, context: GeneratorContext, options?: ResolveExpressionOptions, server = false): string[] {
  for (let i = 0; i < parameters.length; i++) {
    context.addIdentifier(parameters[i].name, 'variable');
  }

  const lines = new Array<string>();
  for (let i = 0; i < parameters.length; i++) {
    const { name, initializer } = parameters[i];
    const { slot, id } = context.addressOf(name)!;
    if (!initializer) {
      lines.push(`context[${slot}] = params[${i}];`);
      continue;
    }

    const { expression, variables } = resolveExpression(initializer, context, options);
    if (server) {
      lines.push(`context[${slot}] = ${i} < params.length ? params[${i}] : (${expression});`);
      continue;
    }

    lines.push(`_parameter(context, params, ${declareLetBinding(context, `${key}$${toRoleName(name)}`, expression, slot, id, variables)});`);
  }

  return lines;
}

/**
 * Writes the creation of the runtime scope of a generated function (see `_scope` of the runtime): an array of the size
 * its layout gives, a constant of the module shared by every instance of the block (see
 * `GeneratorContext.declareLayout`).
 *
 * @example
 * createScope('parentContext', '_layout0', 'nodeStrategy'); // '_scope(parentContext, _layout0, nodeStrategy)'
 * createScope('parentContext', '_layout1');                 // '_scope(parentContext, _layout1)'
 * createScope('null', '_layout0', 'nodeStrategy', 'this');  // '_scope(null, _layout0, nodeStrategy, this)'
 *
 * @param parent - The expression of the scope declaring the block, `null` for the root of a render.
 * @param layout - The name of the constant of the layout.
 * @param nodeStrategy - The expression of the node strategy, `undefined` to inherit the one of the parent.
 * @param component - The expression of the component, for the root scope of a render, which the scopes inside it
 *   inherit: the runtime calls the functions of the module computing the expressions with it as `this`.
 * @returns The expression creating the scope.
 */
export function createScope(parent: string, layout: string, nodeStrategy?: string, component?: string): string {
  if (component) {
    return `_scope(${parent}, ${layout}, ${nodeStrategy}, ${component})`;
  }

  return nodeStrategy ? `_scope(${parent}, ${layout}, ${nodeStrategy})` : `_scope(${parent}, ${layout})`;
}
