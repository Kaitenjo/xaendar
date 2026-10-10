import { indent } from '@xaendar/common';
import { ASTNodeType } from '../../../parser/types/node.enum';
import { IfNode } from '../../../parser/types/nodes/if-node.type';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { getBlockIdentifier, resolveExpression } from '../../utils/generator/generator.utils';

export async function generateIf(node: IfNode, parentNode: string, index: string, compilerContext: CompilerContext, anchor: string | null): Promise<GeneratorTransitionFunctionReturnType> {
  const ifContext = new CompilerContext(compilerContext);
  const retVal: GeneratorTransitionFunctionReturnType = {
    code: [],
    functionsToProcess: new Map()
  };

  retVal.code.push(`_if(${parentNode}, context, ${anchor}, [`);
  const ifKey = getBlockIdentifier('if', parentNode, index);
  retVal.code.push(
    ...indent([
      '{',
      ...indent([`condition: () => ${resolveExpression(node.conditionNode, compilerContext).expression},`, `block: ${ifKey}.bind(this)`]),
      '},'
    ])
  );

  retVal.functionsToProcess!.set(ifKey, {
    fn: { node, parentNode: ifKey, context: ifContext, anchor: 'anchor' },
    args: [ifKey, 'parentContext', 'anchor']
  });

  let alt = node.alternate;
  let i = 0;
  while (alt?.type === ASTNodeType.ElseIf) {
    const elseIfContext = new CompilerContext(compilerContext);
    const elseIfKey = getBlockIdentifier('elseIf', parentNode, `${index}_${i}`);
    const conditionNode = alt.conditionNode;

    retVal.code.push(
      ...indent([
        '{',
        ...indent([`condition: () => ${resolveExpression(conditionNode, compilerContext).expression},`, `block: ${elseIfKey}.bind(this)`]),
        '},'
      ])
    );

    retVal.functionsToProcess!.set(elseIfKey, {
      fn: { node: alt, parentNode: elseIfKey, context: elseIfContext, anchor: 'anchor' },
      args: [elseIfKey, 'parentContext', 'anchor']
    });
    alt = alt.alternate;
    i++;
  }

  if (alt) {
    const elseContext = new CompilerContext(compilerContext);
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
      args: [elseKey, 'parentContext', 'anchor']
    });
  }

  retVal.code.push(']);');
  return retVal
}