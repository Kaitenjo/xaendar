import type { NoArgsFunction } from '@xaendar/types';
import { isSpreadElement, type CallExpression } from 'typescript';
import { TokenType } from '../../../lexer/types/token-type.enum';
import type { RenderToken } from '../../../lexer/types/tokens/render-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import type { ASTNode, MaybeASTNodeWithSpan } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import type { RenderNode } from '../../types/nodes/render-node.type';
import { getTemplateSpan, validateExpression } from '../../utils/expression-validator/expression-validator';
import { isValidIdentifier } from '../../utils/identifier/identifier.utils';

/**
 * Parses a `@render`, consuming the RENDER token and the RENDER_CALL token following it, e.g. `@render row(item(), 1)`,
 * into a `RenderNode`: the call is validated as a template expression.
 *
 * @param cursor - Parser cursor positioned at the RENDER token.
 * @param _parseNode - Unused parser function (kept for signature consistency).
 * @param token - The RENDER token.
 * @returns The parsed `RenderNode`.
 * @throws If the template ends before the call, the name of the template is not an identifier, or an argument is not a
 *   valid template expression or spreads its values.
 */
export function parseRender(cursor: ParserCursor, _parseNode: NoArgsFunction<ASTNode | undefined>, token: RenderToken): MaybeASTNodeWithSpan<RenderNode> {
  // consume RENDER
  cursor.advance();

  const callToken = cursor.peek();
  if (callToken.type !== TokenType.RENDER_CALL) {
    throw '@render calls a template by its name, followed by its arguments in parentheses, e.g. @render row(item())';
  }

  // consume RENDER_CALL
  cursor.advance();
  const [callee, args] = callToken.parts;
  const { start } = callToken.span;
  const calleeSpan = { start, end: start + callee.length };
  if (!isValidIdentifier(callee)) {
    throw new Error(`'${callee}' cannot name a template: it must be an identifier`, { cause: calleeSpan });
  }

  // The arguments are validated together with the call, written verbatim in the template: the lexer reads them up to
  // the parenthesis balancing the one opening them, so the source is always a single call
  const call = validateExpression(`${callee}(${args})`, start).node as CallExpression;
  const spread = call.arguments.find(isSpreadElement);
  if (spread) {
    throw new Error('@render passes each argument to its parameter: spread the values in separate arguments, e.g. @render row(pair()[0], pair()[1])', { cause: getTemplateSpan(spread) });
  }

  return {
    type: ASTNodeType.Render,
    callee,
    calleeSpan,
    arguments: call.arguments,
    span: { start: token.span.start, end: callToken.span.end }
  };
}
