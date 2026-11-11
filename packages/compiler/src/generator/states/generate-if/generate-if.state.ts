import { ASTNodeType } from '../../../parser/types/node.enum';
import { IfNode } from '../../../parser/types/nodes/if-node.type';
import { GeneratorContext } from '../../context/context';
import { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { appendBlockPosition, getContentAnchor } from '../../utils/block-position/block-position.utils';
import { getBlockIdentifier, joinVariables, resolveExpression } from '../../utils/generator/generator.utils';
import { declareExpression, toArrayLiteral, toObjectLiteral } from '../../utils/module-code/module-code.utils';

/**
 * Generates the code of an `@if` / `@else if` / `@else` chain: a `_if(...)` call receiving a constant of the module
 * (`div0__if0$if`, see `BlockConfig` of the runtime) listing a branch per block, the condition of the branch, if any,
 * a function of the module the runtime calls with the component and the context, and the function rendering it, a scope
 * of its own, rendered before the anchor it receives. When the conditions read variables of the enclosing scopes, the
 * constant lists their names, so that the chain selects the branch again when they change. The last node of its parent
 * is `last`, rendered without anchor, its branches at the end of the parent (see `isLastRenderedChild`).
 *
 * @example
 * // @if (row.done) { … } @else { … }
 * const div0__if0$if = { branches: [{ condition: div0__if0$condition, block: div0__if0 }, { block: div0__else0 }], reads: _reads0 };
 * _if(div0, context, null, div0__if0$if);
 *
 * @param node - The `IfNode` to process.
 * @param parentNode - Variable name of the parent DOM node.
 * @param index - The index of the node among its siblings.
 * @param generatorContext - Current render scope context.
 * @param anchor - The name of the anchor variable the chain is rendered before, or `null` to append it.
 * @param _separated - Unused: a block is never separated from a text.
 * @param last - Whether the block is the last node of its parent, which needs no anchor (see `isLastRenderedChild`).
 * @returns The generated code, and the functions of the branches.
 */
export async function generateIf(node: IfNode, parentNode: string, index: string, generatorContext: GeneratorContext, anchor: string | null, _separated = false, last = false): Promise<GeneratorTransitionFunctionReturnType> {
  const contentAnchor = getContentAnchor(last);
  const retVal: GeneratorTransitionFunctionReturnType = {
    code: [],
    functionsToProcess: new Map()
  };

  const ifKey = getBlockIdentifier('if', parentNode, index);
  const branches = new Array<string>();
  const condition = resolveExpression(node.conditionNode, generatorContext);
  let variables: readonly string[] | undefined = condition.variables;
  branches.push(toObjectLiteral([`condition: ${declareExpression(generatorContext, `${ifKey}$condition`, condition.expression)}`, `block: ${ifKey}`]));
  retVal.functionsToProcess!.set(ifKey, {
    fn: { node, parentNode: ifKey, context: new GeneratorContext(generatorContext), anchor: contentAnchor },
    args: [ifKey, 'parentContext', 'anchor', 'nodeStrategy']
  });

  let alt = node.alternate;
  let i = 0;
  while (alt?.type === ASTNodeType.ElseIf) {
    const elseIfKey = getBlockIdentifier('elseIf', parentNode, `${index}_${i}`);
    const elseIfCondition = resolveExpression(alt.conditionNode, generatorContext);
    variables = joinVariables(variables, elseIfCondition.variables);
    branches.push(toObjectLiteral([`condition: ${declareExpression(generatorContext, `${elseIfKey}$condition`, elseIfCondition.expression)}`, `block: ${elseIfKey}`]));
    retVal.functionsToProcess!.set(elseIfKey, {
      fn: { node: alt, parentNode: elseIfKey, context: new GeneratorContext(generatorContext), anchor: contentAnchor },
      args: [elseIfKey, 'parentContext', 'anchor', 'nodeStrategy']
    });
    alt = alt.alternate;
    i++;
  }

  if (alt) {
    const elseKey = getBlockIdentifier('else', parentNode, index);
    branches.push(toObjectLiteral([`block: ${elseKey}`]));
    retVal.functionsToProcess!.set(elseKey, {
      fn: { node: alt, parentNode: elseKey, context: new GeneratorContext(generatorContext), anchor: contentAnchor },
      args: [elseKey, 'parentContext', 'anchor', 'nodeStrategy']
    });
  }

  const members = [`branches: ${toArrayLiteral(branches)}`];
  const reads = generatorContext.getReads(variables);
  if (reads) {
    members.push(`reads: ${reads}`);
  }

  appendBlockPosition(members, last);
  const config = generatorContext.declareConstant(`${ifKey}$if`, toObjectLiteral(members));
  retVal.code.push(`_if(${parentNode}, context, ${anchor}, ${config});`);
  return retVal;
}
