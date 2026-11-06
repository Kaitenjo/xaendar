import { indent } from '@xaendar/common';
import { ASTNodeType } from '../../../parser/types/node.enum';
import { IfNode } from '../../../parser/types/nodes/if-node.type';
import { GeneratorContext } from '../../context/context';
import { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { getBlockIdentifier, resolveExpression } from '../../utils/generator/generator.utils';

export async function generateIf(node: IfNode, parentNode: string, index: string, generatorContext: GeneratorContext, anchor: string | null): Promise<GeneratorTransitionFunctionReturnType> {
  const ifContext = new GeneratorContext(generatorContext);
  const retVal: GeneratorTransitionFunctionReturnType = {
    code: [],
    functionsToProcess: new Map()
  };

  retVal.code.push(`_if(${parentNode}, context, ${anchor}, [`);
  const ifKey = getBlockIdentifier('if', parentNode, index);
  retVal.code.push(
    ...indent([
      '{',
      ...indent([`condition: () => ${resolveExpression(node.conditionNode, generatorContext).expression},`, `block: ${ifKey}.bind(this)`]),
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
    const conditionNode = alt.conditionNode;

    retVal.code.push(
      ...indent([
        '{',
        ...indent([`condition: () => ${resolveExpression(conditionNode, generatorContext).expression},`, `block: ${elseIfKey}.bind(this)`]),
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

  retVal.code.push(']);');
  return retVal
}