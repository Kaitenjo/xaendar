import { SwitchNode } from '../../../parser/types/nodes/switch-node.type';
import { GeneratorContext } from '../../context/context';
import type { BlockBranch } from '../../types/block-branch.type';
import { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { addBranch, allocateBlockSlot, appendBlockPosition, appendContainer, describeBranch, getContentAnchor } from '../../utils/block-position/block-position.utils';
import { getBlockIdentifier, resolveExpression } from '../../utils/generator/generator.utils';
import { declareExpression } from '../../utils/module-code/module-code.utils';

/**
 * Generates code for a `@switch` node: a `_switch(...)` call receiving a constant of the module (`td0__switch0$switch`,
 * see `BlockConfig` of the runtime) holding the expression, a function of the module the runtime calls with the
 * component and the context, and a branch per `@case` and `@default`, each with its values, `null` for the `@default`,
 * and the function rendering it, in a scope of its own or, when it declares nothing and renders no block, inline into
 * the scope holding the block (see `describeBranch`), its constant then declared with the layout of that scope. When the expression reads variables of the enclosing scopes, the
 * constant lists their names, so that the block selects the case again when they change.
 *
 * @example
 * // @switch (col.type) { @case ('text') { … } @default { … } }
 * const td0__switch0$switch = {
 *   expression: td0__switch0$expression,
 *   reads: _reads0,
 *   update: _runIf,
 *   effect: 0,
 *   branches: [{ condition: ['text'], block: td0__case0_0 }, { condition: null, block: td0__default0 }]
 * };
 * _switch(td0, context, null, td0__switch0$switch);
 *
 * @param node - The `SwitchNode` to process.
 * @param parentNode - Variable name of the parent DOM node.
 * @param index - The index of the node among its siblings.
 * @param generatorContext - Current render scope context.
 * @param anchor - The name of the anchor variable the block is rendered before, or `null` to append it.
 * @param _separated - Unused: a block is never separated from a text.
 * @param last - Whether the block is the last node of its parent, which needs no anchor (see `isLastRenderedChild`).
 * @returns The generated code, and the functions of the cases.
 */
export async function generateSwitch(node: SwitchNode, parentNode: string, index: string, generatorContext: GeneratorContext, anchor: string | null, _separated = false, last = false): Promise<GeneratorTransitionFunctionReturnType> {
  const contentAnchor = getContentAnchor(last);
  const retVal: GeneratorTransitionFunctionReturnType = {
    code: [],
    functionsToProcess: new Map()
  };

  const switchKey = getBlockIdentifier('switch', parentNode, index);
  const { expression, variables } = resolveExpression(node.expression, generatorContext);
  const branches = new Array<BlockBranch>();
  const children = node.children;
  for (let i = 0; i < children.length; i++) {
    const caseNode = children[i];
    const caseKey = caseNode.condition ? getBlockIdentifier('case', parentNode, `${index}_${i}`) : getBlockIdentifier('default', parentNode, index);
    addBranch(retVal, branches, describeBranch(caseNode, caseKey, [`condition: ${caseNode.condition ? `[${caseNode.condition.join(', ')}]` : 'null'}`], generatorContext, contentAnchor));
  }

  const members = [`expression: ${declareExpression(generatorContext, `${switchKey}$expression`, expression)}`];
  const reads = generatorContext.getReads(variables);
  if (reads) {
    members.push(`reads: ${reads}`);
  }

  appendBlockPosition(members, last, allocateBlockSlot(generatorContext, last));
  appendContainer(members, generatorContext);
  const config = generatorContext.declareBlock(`${switchKey}$switch`, members, branches, '_runIf');
  retVal.code.push(`_switch(${parentNode}, context, ${anchor}, ${config});`);
  return retVal;
}
