import type { ASTNode } from '../../../parser/types/ast.type';
import type { ClientNode } from '../../../parser/types/nodes/client-node.type';
import { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import type { Line } from '../../types/line.type';
import { ProcessNode } from '../../types/type-checker-process-node.type';
import { indentLines, plain } from '../../utils/line-builder/line-builder.utils';
import { typeCheckScope } from '../../utils/scope/scope.utils';

/**
 * Type-checks a `@client` block: its content and the `@placeholder` following it, if any, each one a scope of its own.
 *
 * @param node - The client node.
 * @param processNode - Type-checks a node of a block.
 * @param context - The scope the block is in.
 * @returns The generated type-check lines.
 */
export function typeCheckClient(node: ClientNode, processNode: ProcessNode, context: TypeCheckContext): Line[] {
  const lines = typeCheckBlock(node.children, processNode, context);
  return node.placeholder ? lines.concat(typeCheckBlock(node.placeholder.children, processNode, context)) : lines;
}

/**
 * Type-checks a block of a `@client` as a scope of its own.
 *
 * @param children - The nodes of the block.
 * @param processNode - Type-checks a node of the block.
 * @param context - The scope the `@client` is in.
 * @returns The generated type-check lines.
 */
function typeCheckBlock(children: ASTNode[], processNode: ProcessNode, context: TypeCheckContext): Line[] {
  const { declarations, lines } = typeCheckScope(children, new TypeCheckContext(context), processNode);
  return [plain('{'), ...indentLines(declarations.concat(lines)), plain('}')];
}
