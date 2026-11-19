import { resolveExpression, type GeneratorContext, type LetNode } from '@xaendar/compiler';
import type { ServerParent } from '../../types/server-parent.type';
import type { ServerTransitionResult } from '../../types/server-transition-result.type';
import { SERVER_RESOLVE_OPTIONS } from '../../utils/server-code/server-code.utils';

/**
 * Generates the code initializing a `@let`, declared at the start of its scope, once the render reaches it: with the
 * value of its expression, read once, as the server reads every value, which the expressions reading the `@let` read as
 * the client does.
 *
 * @param node - The `@let` node.
 * @param _parent - Unused place of the node.
 * @param _index - Unused position of the node.
 * @param generatorContext - The generator context of the node.
 * @returns The code of the node.
 */
export function generateServerLet(node: LetNode, _parent: ServerParent, _index: string, generatorContext: GeneratorContext): ServerTransitionResult {
  const { expression } = resolveExpression(node.value, generatorContext, SERVER_RESOLVE_OPTIONS);
  const { depth, slot } = generatorContext.addressOf(node.name)!;
  return { pieces: [{ statement: `_set(context, ${depth}, ${slot}, ${expression});` }] };
}
