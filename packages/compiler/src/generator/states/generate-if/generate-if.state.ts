import { indent } from '@xaendar/common';
import { ASTNodeType } from '../../../parser/types/node.enum';
import { IfNode } from '../../../parser/types/nodes/if-node.type';
import { GeneratorContext } from '../../context/context';
import { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { getBlockIdentifier, joinVariables, resolveExpression } from '../../utils/generator/generator.utils';

/**
 * Generates the code of an `@if` / `@else if` / `@else` chain: a `_if(...)` call receiving a block per branch, the
 * condition of the branch, if any, and the function rendering it, a scope of its own, rendered before the anchor it
 * receives. When the conditions read variables of the enclosing scopes, `_if` receives their names, so that it selects
 * the branch again when they change.
 *
 * @example
 * // @if (row.done) { … } @else { … }
 * _if(parent, context, null, [
 *   { condition: () => context.get('row').done, block: if0.bind(this) },
 *   { block: else0.bind(this) },
 * ], _reads0);
 *
 * @param node - The `IfNode` to process.
 * @param parentNode - Variable name of the parent DOM node.
 * @param index - The index of the node among its siblings.
 * @param generatorContext - Current render scope context.
 * @param anchor - The name of the anchor variable the chain is rendered before, or `null` to append it.
 * @returns The generated code, and the functions of the branches.
 */
export async function generateIf(node: IfNode, parentNode: string, index: string, generatorContext: GeneratorContext, anchor: string | null): Promise<GeneratorTransitionFunctionReturnType> {
  const ifContext = new GeneratorContext(generatorContext);
  const retVal: GeneratorTransitionFunctionReturnType = {
    code: [],
    functionsToProcess: new Map()
  };

  retVal.code.push(`_if(${parentNode}, context, ${anchor}, [`);
  const ifKey = getBlockIdentifier('if', parentNode, index);
  const condition = resolveExpression(node.conditionNode, generatorContext);
  let variables: readonly string[] | undefined = condition.variables;
  retVal.code.push(
    ...indent([
      '{',
      ...indent([`condition: () => ${condition.expression},`, `block: ${ifKey}.bind(this)`]),
      '},'
    ])
  );

  retVal.functionsToProcess!.set(ifKey, {
    fn: { node, parentNode: ifKey, context: ifContext, anchor: 'anchor' },
    args: [ifKey, 'parentContext', 'anchor', 'nodeStrategy']
  });

  let alt = node.alternate;
  let i = 0;
  while (alt?.type === ASTNodeType.ElseIf) {
    const elseIfContext = new GeneratorContext(generatorContext);
    const elseIfKey = getBlockIdentifier('elseIf', parentNode, `${index}_${i}`);
    const elseIfCondition = resolveExpression(alt.conditionNode, generatorContext);
    variables = joinVariables(variables, elseIfCondition.variables);

    retVal.code.push(
      ...indent([
        '{',
        ...indent([`condition: () => ${elseIfCondition.expression},`, `block: ${elseIfKey}.bind(this)`]),
        '},'
      ])
    );

    retVal.functionsToProcess!.set(elseIfKey, {
      fn: { node: alt, parentNode: elseIfKey, context: elseIfContext, anchor: 'anchor' },
      args: [elseIfKey, 'parentContext', 'anchor', 'nodeStrategy']
    });
    alt = alt.alternate;
    i++;
  }

  if (alt) {
    const elseContext = new GeneratorContext(generatorContext);
    const elseKey = getBlockIdentifier('else', parentNode, index);
    retVal.code.push(
      ...indent([
        '{',
        ...indent([`block: ${elseKey}.bind(this)`]),
        '},'
      ])
    );

    retVal.functionsToProcess!.set(elseKey, {
      fn: { node: alt, parentNode: elseKey, context: elseContext, anchor: 'anchor' },
      args: [elseKey, 'parentContext', 'anchor', 'nodeStrategy']
    });
  }

  const reads = generatorContext.getReads(variables);
  retVal.code.push(reads ? `], ${reads});` : ']);');
  return retVal
}
