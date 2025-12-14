import { LexerState } from './lexer-state.enum'
import { Token } from './token.type'

export type LexerTransitionFunctionReturnType = {
  state: LexerState
  // TOOD: Understand if a transition can return more than one token
  tokens?: Token[]
}