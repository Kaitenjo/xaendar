import { Token } from '../../lexer/models/token.type.js'

export type CurrentToken = {
  value: Token
  index: number
}