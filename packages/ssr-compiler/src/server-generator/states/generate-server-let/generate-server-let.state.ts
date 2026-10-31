import { resolveExpression, type CompilerContext, type LetNode } from '@xaendar/compiler';
import type { ServerParent } from '../../types/server-parent.type';
import type { ServerTransitionResult } from '../../types/server-transition-result.type';
import { SERVER_RESOLVE_OPTIONS } from '../../utils/server-code/server-code.utils';

/**
 * Generates the code initializing a `@let`, declared at the start of its scope, once the render reaches it, as the
 * client initializes it: with the value of its expression, or, when the expression reads a signal, with a signal
 * computing it, which the expressions reading the `@let` call.
 *
 * @param node - The `@let` node.
 * @param _parent - Unused place of the node.
 * @param _index - Unused position of the node.
 * @param compilerContext - The compiler context of the node.
 * @returns The code of the node.
 */
export function generateServerLet(node: LetNode, _parent: ServerParent, _index: string, compilerContext: CompilerContext): ServerTransitionResult {
  const { expression, reactive } = resolveExpression(node.value, compilerContext, SERVER_RESOLVE_OPTIONS);
  return { pieces: [{ statement: `context.set('${node.name}', ${reactive ? `_let(() => ${expression})` : expression});` }] };
}
