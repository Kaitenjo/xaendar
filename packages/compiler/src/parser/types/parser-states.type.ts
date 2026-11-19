import { TokenType } from '../../lexer/types/token-type.enum'
import { ForToken } from '../../lexer/types/tokens/for-token.type'
import type { ClientToken } from '../../lexer/types/tokens/client-token.type'
import type { HydrateToken } from '../../lexer/types/tokens/hydrate-token.type'
import type { PlaceholderToken } from '../../lexer/types/tokens/placeholder-token.type'
import type { TryToken } from '../../lexer/types/tokens/try-token.type'
import type { CatchToken } from '../../lexer/types/tokens/catch-token.type'
import type { DeferToken } from '../../lexer/types/tokens/defer-token.type'
import type { LoadingToken } from '../../lexer/types/tokens/loading-token.type'
import type { ErrorToken } from '../../lexer/types/tokens/error-token.type'
import type { EmptyToken } from '../../lexer/types/tokens/empty-token.type'
import { IfToken } from '../../lexer/types/tokens/if-token.type'
import { ImportPathToken } from '../../lexer/types/tokens/import-path-token.type'
import { InterpolationExpressionToken } from '../../lexer/types/tokens/interpolation-expression-token.type'
import type { LetToken } from '../../lexer/types/tokens/let-token.type'
import type { RenderToken } from '../../lexer/types/tokens/render-token.type'
import { SwitchToken } from '../../lexer/types/tokens/switch-token.type'
import { TagOpenNameToken } from '../../lexer/types/tokens/tag-open-name-token.type'
import { TextToken } from '../../lexer/types/tokens/text-token.type'
import { ParserTransitionFunction } from './parser-transition-function.type'
import type { OmittedKeys } from './omitted-keys.type';

/**
 * Type mapping each TokenType to its corresponding parser transition function, 
 * which defines how to parse that token type into an AST node.
 * 
 * This structure allows the parser to dynamically select the appropriate parsing 
 * logic based on the type of token encountered in the token stream.
 * 
 * Each entry in this mapping corresponds to a specific token type and its associated parsing function, 
 * ensuring that the parser can handle all defined token types correctly.
 */
export type ParserStates = {
  [TokenType.TEXT]: ParserTransitionFunction<TextToken>,
  [TokenType.INTERPOLATION_EXPRESSION]: ParserTransitionFunction<InterpolationExpressionToken>,
  [TokenType.TAG_OPEN_NAME]: ParserTransitionFunction<TagOpenNameToken>,
  [TokenType.IF]: ParserTransitionFunction<IfToken>,
  [TokenType.FOR]: ParserTransitionFunction<ForToken>,
  [TokenType.SWITCH]: ParserTransitionFunction<SwitchToken>
  [TokenType.HYDRATE]: ParserTransitionFunction<HydrateToken>,
  [TokenType.CLIENT]: ParserTransitionFunction<ClientToken>,
  [TokenType.PLACEHOLDER]: ParserTransitionFunction<PlaceholderToken>,
  [TokenType.TRY]: ParserTransitionFunction<TryToken>,
  [TokenType.CATCH]: ParserTransitionFunction<CatchToken>,
  [TokenType.DEFER]: ParserTransitionFunction<DeferToken>,
  [TokenType.LOADING]: ParserTransitionFunction<LoadingToken>,
  [TokenType.ERROR]: ParserTransitionFunction<ErrorToken>,
  [TokenType.EMPTY]: ParserTransitionFunction<EmptyToken>,
  [TokenType.IMPORT]: ParserTransitionFunction<ImportPathToken>,
  [TokenType.RENDER]: ParserTransitionFunction<RenderToken>,
  [TokenType.LET]: ParserTransitionFunction<LetToken>
} & 
{ 
  [K in OmittedKeys]?: undefined 
}