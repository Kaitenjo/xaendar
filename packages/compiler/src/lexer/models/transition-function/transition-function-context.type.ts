import { LexerState } from "../lexer-state.enum"

export type LexerTransitionFunctionContext = {
  history: Array<LexerState>
}