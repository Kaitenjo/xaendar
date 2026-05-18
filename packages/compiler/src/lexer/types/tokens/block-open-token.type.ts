import { TokenType } from '../token-type.enum.js';

/**
 * Token emitted when the lexer encounters the opening `{` of a flow-control block body.
 */
export type BlockOpenToken = {
  /**
   * Discriminant identifying this token as a block open.
   */
  type: TokenType.BLOCK_OPEN
}
