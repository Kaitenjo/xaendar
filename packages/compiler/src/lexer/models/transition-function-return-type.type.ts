import { LexerState } from './lexer-state.enum'
import { Token } from './token.type'

export type LexerTransitionFunctionReturnType = {
  state: LexerState
  tokens?: Token[]
}