import { Token } from "../../lexer/models/token.type"

export type CurrentToken = {
  value: Token
  index: number
}