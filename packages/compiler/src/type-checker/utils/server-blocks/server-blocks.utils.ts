import type { ASTNode } from '../../../parser/types/ast.type';
import { ASTNodeType } from '../../../parser/types/node.enum';
import { visitNodes } from '../visit-nodes/visit-nodes.utils';

/**
 * Checks a template of a project that does not render on the server: a `@hydrate` or a `@client` say what to do with the
 * HTML of the server, and there is none, so the template would not do what it declares.
 *
 * It is a check of its own, not of the state of the nodes, so that the editor keeps checking the content of the blocks.
 *
 * @example
 * checkServerBlocks(parseTemplate('@client { <p></p> }')); // [Error: @client is only for a project rendering on the server…]
 * checkServerBlocks(parseTemplate('<p></p>'));             // []
 *
 * @param nodes - The nodes of the template.
 * @returns The errors, each one carrying the span of the keyword of its block as its cause.
 */
export function checkServerBlocks(nodes: readonly ASTNode[]): Error[] {
  const errors = new Array<Error>;
  visitNodes(nodes, node => {
    if (node.type === ASTNodeType.Hydrate || node.type === ASTNodeType.Client) {
      const keyword = node.type === ASTNodeType.Hydrate ? '@hydrate' : '@client';
      const { start } = node.span;
      errors.push(new Error(`${keyword} is only for a project rendering on the server: declare "ssr" in its xaendar.json, or remove the block`, { cause: { start, end: start + keyword.length } }));
    }
  });

  return errors;
}
