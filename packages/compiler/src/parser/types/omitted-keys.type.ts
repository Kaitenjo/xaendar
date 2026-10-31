import type { TokenType } from '../../lexer/types/token-type.enum';

/**
 * The token types the parser has no transition function for.
 */
export type OmittedKeys = Exclude<TokenType, 
 | TokenType.TEXT
 | TokenType.INTERPOLATION_EXPRESSION
 | TokenType.TAG_OPEN_NAME
 | TokenType.IF
 | TokenType.FOR 
 | TokenType.SWITCH
 | TokenType.IMPORT 
 | TokenType.RENDER
 | TokenType.LET
>
