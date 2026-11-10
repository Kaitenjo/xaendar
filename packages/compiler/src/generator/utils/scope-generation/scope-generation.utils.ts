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

/**
 * Declares the element refs, the templates and the `@let` of a scope: registers them in its generator context, so
 * that every expression and every `@render` of the scope reads them, the ones written before their declaration too, and
 * writes the code declaring them in its runtime context:
 * - an element ref is declared uninitialized, and the element it names initializes it once rendered;
 * - a template is initialized with the function rendering its content (see `toTemplateFunction`), together with the
 *   runtime context of the scope, which its content reads names from, and, on the client, the names of its parameters,
 *   a constant of the module the function to process declares (`template_row_12Parameters`);
 * - a `@let` is declared uninitialized, and initialized once the render reaches it (see `generateLet`): it is a variable
 *   of the template, whose value the runtime computes again, unless its value is a literal, which never changes.
 *
 * @param nodes - The nodes of the scope.
 * @param generatorContext - The generator context of the scope.
 * @param toTemplateFunction - Describes the function rendering an instance of a template of the scope.
 * @param templateFactory - The runtime function creating the value of a template from the runtime context of its scope
 *   and from the function rendering an instance of it.
 * @param templateParameters - Whether the value of a template receives the names of its parameters, which the client
 *   updates in an instance rendered again with other arguments, while the server renders every instance once.
 * @returns The code declaring the names, and the functions rendering the content of the templates, `undefined` if the
 *   scope declares none.
 */
export function declareScope(nodes: readonly ASTNode[], generatorContext: GeneratorContext, toTemplateFunction: TemplateFunctionFactory, templateFactory = '_template', templateParameters = true): Required<GeneratorTransitionFunctionReturnType> | undefined {
  const declarations: Required<GeneratorTransitionFunctionReturnType> = { code: [], functionsToProcess: new Map() };
  const lets = new Array<LetNode>();
  const templates = new Array<{ template: TemplateNode, key: string, namespace: ElementNamespace }>();
  visitScopeDeclarations(nodes, generatorContext.namespace, {
    let: node => lets.push(node),
    ref: (_element, { name }) => {
      generatorContext.addIdentifier(name, 'value');
      declarations.code.push(`context.declare('${name}');`);
    },
    template: (template, namespace) => {
      const { name } = template.declaration;
      const key = `template_${name}_${template.span.start}`;
      generatorContext.addIdentifier(name, 'value');
      generatorContext.addTemplate(name, namespace);
      declarations.code.push(`context.addIdentifier('${name}', ${templateFactory}(context, ${key}.bind(this)${templateParameters ? `, ${key}Parameters` : ''}));`);
      templates.push({ template, key, namespace });
    }
  });

  for (let i = 0; i < lets.length; i++) {
    const { name, value } = lets[i];
    generatorContext.addIdentifier(name, isConstantExpression(value) ? 'value' : 'variable');
    declarations.code.push(`context.declare('${name}', 'let');`);
  }

  // Described once every name of the scope is registered: the default values of the parameters read them, the @let too
  for (let i = 0; i < templates.length; i++) {
    const { template, key, namespace } = templates[i];
    declarations.functionsToProcess.set(key, toTemplateFunction(template, key, namespace, generatorContext));
  }

  return declarations.code.length ? declarations : undefined;
}

/**
 * Declares the parameters of a template in the generator context of the content of an instance, as variables of the
 * template read like the item of a `@for`, and writes the code adding them to its runtime context: the values the
 * function rendering the instance receives as `params`. A parameter whose argument the `@render` leaves out holds its
 * default value, which reads the parameters before it, or `undefined`.
 *
 * On the client the default value is computed as the value of a `@let` (`_parameter`), again when a signal or another
 * parameter it reads changes, while the server, which reads every value once, writes it as an expression.
 *
 * @param template - The template.
 * @param context - The generator context of the content of the instance.
 * @param options - The options resolving the default values of the parameters.
 * @param server - Whether the code renders on the server.
 * @returns The lines of code adding the parameters to the runtime context of the instance.
 */
export function declareTemplateParameters({ parameters }: TemplateNode, context: GeneratorContext, options?: ResolveExpressionOptions, server = false): string[] {
  for (let i = 0; i < parameters.length; i++) {
    context.addIdentifier(parameters[i].name, 'variable');
  }

  const lines = new Array<string>();
  for (let i = 0; i < parameters.length; i++) {
    const { name, initializer } = parameters[i];
    if (!initializer) {
      lines.push(`context.addIdentifier('${name}', params[${i}]);`);
      continue;
    }

    const { expression, variables } = resolveExpression(initializer, context, options);
    if (server) {
      lines.push(`context.addIdentifier('${name}', ${i} < params.length ? params[${i}] : (${expression}));`);
      continue;
    }

    const reads = context.getReads(variables);
    lines.push(`_parameter(context, params, ${i}, '${name}', () => ${expression}${reads ? `, ${reads}` : ''});`);
  }

  return lines;
}

/**
 * Writes the creation of the runtime context of a generated function, created for the variables its scope declares:
 * the identifiers registered in the generator context of the scope (see `GeneratorContext.identifierCount`), which the
 * runtime keeps in an array of that size, or in a `Map` beyond its limit.
 *
 * @example
 * createContext('parentContext', 'nodeStrategy', 2); // 'new _Context(parentContext, nodeStrategy, 2)'
 * createContext('parentContext', undefined, 0);      // 'new _Context(parentContext)'
 *
 * @param parent - The expression of the parent context.
 * @param nodeStrategy - The expression of the node strategy, `undefined` to inherit the one of the parent.
 * @param variableCount - The number of variables the scope declares, `0` for a function whose context declares none.
 * @returns The expression creating the context.
 */
export function createContext(parent: string, nodeStrategy: string | undefined, variableCount: number): string {
  if (variableCount) {
    return `new _Context(${parent}, ${nodeStrategy}, ${variableCount})`;
  }

  return nodeStrategy ? `new _Context(${parent}, ${nodeStrategy})` : `new _Context(${parent})`;
}
