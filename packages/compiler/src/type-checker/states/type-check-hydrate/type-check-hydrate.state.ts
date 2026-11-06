import type { HydrateNode } from '../../../parser/types/nodes/hydrate-node.type';
import { TypeCheckContext } from '../../models/context/context';
import type { Line } from '../../types/line.type';
import { ProcessNode } from '../../types/type-checker-process-node.type';
import { indentLines, plain } from '../../utils/line-builder/line-builder.utils';
import { typeCheckScope } from '../../utils/scope/scope.utils';
import { typeCheckTriggers } from '../../utils/triggers/triggers.utils';

/**
 * Type-checks a `@hydrate` block: its triggers (see `typeCheckTriggers`), then its content, a scope of its own.
 *
 * @param node - The hydrate node.
 * @param processNode - Type-checks a node of the content.
 * @param context - The scope the block is in.
 * @returns The generated type-check lines.
 */
export function typeCheckHydrate(node: HydrateNode, processNode: ProcessNode, context: TypeCheckContext): Line[] {
  const lines = typeCheckTriggers(node, context);
  const { declarations, lines: content } = typeCheckScope(node.children, new TypeCheckContext(context), processNode);
  lines.push(plain('{'), ...indentLines(declarations.concat(content)), plain('}'));
  return lines;
}
