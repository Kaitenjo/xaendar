import { NoArgsFunction } from '@xaendar/types';
import { TokenType } from '../../../lexer/types/token-type.enum';
import type { ClientToken } from '../../../lexer/types/tokens/client-token.type';
import type { PlaceholderToken } from '../../../lexer/types/tokens/placeholder-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { ASTNode } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import type { ClientNode } from '../../types/nodes/client-node.type';
import type { PlaceholderNode } from '../../types/nodes/placeholder-node.type';
import { findEvent } from '../../utils/find-event/find-event.utils';
import { parseBlockChildren } from '../parse-block-children/parse-block-children.state';

/**
 * Parses a `@client` block: its content, and the `@placeholder` block following it, if any, which holds no listener: the
 * server renders it, and the browser replaces it without running its code.
 *
 * @param cursor - The parser cursor positioned on the `@client` keyword.
 * @param parseNode - Parses the next node.
 * @param token - The `@client` keyword.
 * @returns The client node.
 * @throws When the `@placeholder` holds a listener.
 */
export function parseClient(cursor: ParserCursor, parseNode: NoArgsFunction<ASTNode | undefined>, token: ClientToken): ClientNode {
  // consume the keyword and BLOCK_OPEN
  cursor.advance(2);
  const children = parseBlockChildren(cursor, parseNode);
  let end = cursor.getCurrentToken().value.span.end;

  let placeholder: PlaceholderNode | null = null;
  const next = cursor.peek();
  if (next.type === TokenType.PLACEHOLDER) {
    // consume the keyword and BLOCK_OPEN
    cursor.advance(2);
    const placeholderChildren = parseBlockChildren(cursor, parseNode);
    const event = findEvent(placeholderChildren);
    if (event) {
      throw new Error(`(${event.name}) never runs: the server renders a @placeholder, and the browser replaces it without running its code`, { cause: event.span });
    }

    end = cursor.getCurrentToken().value.span.end;
    placeholder = {
      type: ASTNodeType.Placeholder,
      children: placeholderChildren,
      span: { start: next.span.start, end }
    };
  }

  return {
    type: ASTNodeType.Client,
    children,
    placeholder,
    span: { start: token.span.start, end }
  };
}

/**
 * Rejects a `@placeholder` block not following the block of a `@client` or of a `@defer`, or following the
 * `@placeholder` of a `@client`.
 *
 * @param _cursor - Unused parser cursor.
 * @param _parseNode - Unused.
 * @param token - The keyword of the block.
 * @throws Always.
 */
export function parseOrphanPlaceholder(_cursor: ParserCursor, _parseNode: NoArgsFunction<ASTNode | undefined>, token: PlaceholderToken): never {
  throw new Error('@placeholder must follow the block of a @client or a @defer', { cause: token.span });
}
