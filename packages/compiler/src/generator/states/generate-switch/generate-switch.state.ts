import { SwitchNode } from '../../../parser/types/nodes/switch-node.type';
import { GeneratorContext } from '../../context/context';
import { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { getBlockIdentifier, resolveExpression } from '../../utils/generator/generator.utils';
import { declareExpression, toArrayLiteral, toObjectLiteral } from '../../utils/module-code/module-code.utils';

/**
 * Generates code for a `@switch` node: a `_switch(...)` call receiving a constant of the module (`td0__switch0$switch`,
 * see `BlockConfig` of the runtime) holding the expression, a function of the module the runtime calls with the
 * component and the context, and a branch per `@case` and `@default`, each with its values, `null` for the `@default`,
 * and the function rendering it, a scope of its own. When the expression reads variables of the enclosing scopes, the
 * constant lists their names, so that the block selects the case again when they change.
 *
 * @example
 * // @switch (col.type) { @case ('text') { … } @default { … } }
 * const td0__switch0$switch = {
 *   expression: td0__switch0$expression,
 *   branches: [{ condition: ['text'], block: td0__case0_0 }, { condition: null, block: td0__default0 }],
 *   reads: _reads0
 * };
 * _switch(td0, context, null, td0__switch0$switch);
 *
 * @param node - The `SwitchNode` to process.
 * @param parentNode - Variable name of the parent DOM node.
 * @param index - The index of the node among its siblings.
 * @param generatorContext - Current render scope context.
 * @param anchor - The name of the anchor variable the block is rendered before, or `null` to append it.
 * @returns The generated code, and the functions of the cases.
 */
export async function generateSwitch(node: SwitchNode, parentNode: string, index: string, generatorContext: GeneratorContext, anchor: string | null): Promise<GeneratorTransitionFunctionReturnType> {
  const retVal: GeneratorTransitionFunctionReturnType = {
    code: [],
    functionsToProcess: new Map()
  };

  const switchKey = getBlockIdentifier('switch', parentNode, index);
  const { expression, variables } = resolveExpression(node.expression, generatorContext);
  const branches = new Array<string>();
  const children = node.children;
  for (let i = 0; i < children.length; i++) {
    const caseNode = children[i];
    const caseKey = caseNode.condition ? getBlockIdentifier('case', parentNode, `${index}_${i}`) : getBlockIdentifier('default', parentNode, index);
    retVal.functionsToProcess!.set(caseKey, {
      fn: { node: caseNode, parentNode: caseKey, context: new GeneratorContext(generatorContext), anchor: 'anchor' },
      args: [caseKey, 'parentContext', 'anchor', 'nodeStrategy']
    });

    branches.push(toObjectLiteral([`condition: ${caseNode.condition ? `[${caseNode.condition.join(', ')}]` : 'null'}`, `block: ${caseKey}`]));
  }

  const members = [
    `expression: ${declareExpression(generatorContext, `${switchKey}$expression`, expression)}`,
    `branches: ${toArrayLiteral(branches)}`
  ];
  const reads = generatorContext.getReads(variables);
  if (reads) {
    members.push(`reads: ${reads}`);
  }

  const config = generatorContext.declareConstant(`${switchKey}$switch`, toObjectLiteral(members));
  retVal.code.push(`_switch(${parentNode}, context, ${anchor}, ${config});`);
  return retVal;
}
