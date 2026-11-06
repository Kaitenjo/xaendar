import type { HydrateNode } from '../../../parser/types/nodes/hydrate-node.type';
import { TypeCheckContext } from '../../models/context/context';
import type { Line } from '../../types/line.type';
import { ProcessNode } from '../../types/type-checker-process-node.type';
import { indentLines, line, plain } from '../../utils/line-builder/line-builder.utils';
import { mappedExpression } from '../../utils/mapped-expression/mapped-expression.utils';
import { typeCheckScope } from '../../utils/scope/scope.utils';

/**
 * Type-checks a `@hydrate` block: the expression of its `when` trigger, read as the condition of an `@if`, then its
 * content, a scope of its own.
 *
 * @param node - The hydrate node.
 * @param processNode - Type-checks a node of the content.
 * @param context - The scope the block is in.
 * @returns The generated type-check lines.
 */
export function typeCheckHydrate(node: HydrateNode, processNode: ProcessNode, context: TypeCheckContext): Line[] {
  const lines = new Array<Line>();
  const { triggers } = node;
  for (let i = 0; i < triggers.length; i++) {
    const trigger = triggers[i];
    if (trigger.kind === 'when') {
      lines.push(line('if (', mappedExpression(trigger.expressionNode, context, trigger.span), ') { }'));
    }
  }

  const { declarations, lines: content } = typeCheckScope(node.children, new TypeCheckContext(context), processNode);
  lines.push(plain('{'), ...indentLines(declarations.concat(content)), plain('}'));
  return lines;
}
