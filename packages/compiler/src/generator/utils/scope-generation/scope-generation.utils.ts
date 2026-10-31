import type { ASTNode } from '../../../parser/types/ast.type';
import type { LetNode } from '../../../parser/types/nodes/let-node.type';
import type { TemplateNode } from '../../../parser/types/nodes/template-node.type';
import { visitScopeDeclarations } from '../../../parser/utils/scope-declarations/scope-declarations.utils';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import type { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import type { ResolveExpressionOptions } from '../../types/resolve-expresion-options.type';
import { resolveExpression } from '../generator/generator.utils';
import type { TemplateFunctionFactory } from '../../types/template-function-factory.type';

/**
 * Declares the element refs, the templates and the `@let` of a scope: registers them in its compiler context, so
 * that every expression and every `@render` of the scope reads them, the ones written before their declaration too, and
 * writes the code declaring them in its runtime context:
 * - an element ref is declared uninitialized, and the element it names initializes it once rendered;
 * - a template is initialized with the function rendering its content (see `toTemplateFunction`), together with the
 *   runtime context of the scope, which its content reads names from;
 * - a `@let` is declared uninitialized, and initialized once the render reaches it (see `generateLet`): it is a signal
 *   when its value reads one. The `@let` are registered after the other names, in the order they are written, so that
 *   the value of one tells whether it reads the signal of another one written before it.
 *
 * @param nodes - The nodes of the scope.
 * @param compilerContext - The compiler context of the scope.
 * @param toTemplateFunction - Describes the function rendering an instance of a template of the scope.
 * @param templateFactory - The runtime function creating the value of a template from the runtime context of its scope
 *   and from the function rendering an instance of it.
 * @returns The code declaring the names, and the functions rendering the content of the templates, `undefined` if the
 *   scope declares none.
 */
export function declareScope(nodes: readonly ASTNode[], compilerContext: CompilerContext, toTemplateFunction: TemplateFunctionFactory, templateFactory = '_template'): Required<GeneratorTransitionFunctionReturnType> | undefined {
  let declarations: Required<GeneratorTransitionFunctionReturnType> | undefined;
  const add = (line: string): Required<GeneratorTransitionFunctionReturnType> => {
    declarations ??= { code: [], functionsToProcess: new Map() };
    declarations.code.push(line);
    return declarations;
  };

  const lets = new Array<LetNode>();
  visitScopeDeclarations(nodes, compilerContext.namespace, {
    let: node => lets.push(node),
    ref: (_element, { name }) => {
      compilerContext.addIdentifier(name, 'value');
      add(`context.declare('${name}');`);
    },
    template: (template, namespace) => {
      const { name } = template.declaration;
      const key = `template_${name}_${template.span.start}`;
      compilerContext.addIdentifier(name, 'value');
      compilerContext.addTemplate(name, namespace);
      add(`context.addIdentifier('${name}', ${templateFactory}(context, ${key}.bind(this)));`).functionsToProcess.set(key, toTemplateFunction(template, key, namespace, compilerContext));
    }
  });

  for (let i = 0; i < lets.length; i++) {
    const { name, value } = lets[i];
    compilerContext.addIdentifier(name, resolveExpression(value, compilerContext).reactive ? 'signal' : 'value');
    add(`context.declare('${name}', 'let');`);
  }

  return declarations;
}

/**
 * Declares the parameters of a template in the compiler context of the content of an instance, as signals read like
 * the item of a `@for`, and writes the code adding them to its runtime context: the parameters are the signals the
 * function rendering the instance receives as `params`, and the one of a parameter whose argument the `@render` leaves
 * out holds its default value, which reads the parameters before it, or `undefined`.
 *
 * @param template - The template.
 * @param context - The compiler context of the content of the instance.
 * @param options - The options resolving the default values of the parameters.
 * @returns The lines of code adding the parameters to the runtime context of the instance.
 */
export function declareTemplateParameters({ parameters }: TemplateNode, context: CompilerContext, options?: ResolveExpressionOptions): string[] {
  for (let i = 0; i < parameters.length; i++) {
    context.addIdentifier(parameters[i].name, 'signal');
  }

  const lines = new Array<string>();
  for (let i = 0; i < parameters.length; i++) {
    const { name, optional, initializer } = parameters[i];
    let param = `params[${i}]`;
    if (initializer) {
      param = `_parameter(params, ${i}, () => ${resolveExpression(initializer, context, options).expression})`;
    } else if (optional) {
      param = `_parameter(params, ${i})`;
    }

    lines.push(`context.addIdentifier('${name}', ${param});`);
  }

  return lines;
}
