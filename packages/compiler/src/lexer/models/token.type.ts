import { TokenType } from './token-type.enum';

export type Token =
  | TagOpenNameToken
  | TagSelfCloseToken
  | TagCloseToken
  | TagCloseNameToken
  | AttributeToken
  | EventToken
  | TextToken
  | InterpolationExpressionToken
  | InterpolationLiteralToken
  | IfToken
  | ForToken
  | ElseToken
  | SwitchToken
  | CaseToken
  | DefaultToken
  | ConditionToken
  | BlockOpenToken
  | BlockCloseToken
  | EOFToken

export type TagOpenNameToken = {
  type: TokenType.TAG_OPEN_NAME;
  parts: [string];
}

export type EventToken = {
  type: TokenType.EVENT
  parts: [string]
}

export type AttributeToken = {
  type: TokenType.ATTRIBUTE
  parts: [string]
}

export type TextToken = {
  type: TokenType.TEXT,
  parts: [string]
}

export type InterpolationExpressionToken = {
  type: TokenType.INTERPOLATION_EXPRESSION;
  parts: [string];
}

export type InterpolationLiteralToken = {
  type: TokenType.INTERPOLATION_LITERAL;
  parts: [string];
}

export type TagSelfCloseToken = {
  type: TokenType.TAG_SELF_CLOSE,
  parts: []
}

export type TagCloseNameToken = {
  type: TokenType.TAG_CLOSE_NAME,
  parts: [string]
}

export type TagCloseToken = {
  type: TokenType.TAG_OPEN_END,
  parts: []
}

export type IfToken = { type: TokenType.IF }
export type ForToken = { type: TokenType.FOR }
export type ElseToken = { type: TokenType.ELSE }
export type SwitchToken = { type: TokenType.SWITCH }
export type CaseToken = { type: TokenType.CASE }
export type DefaultToken = { type: TokenType.DEFAULT }

export type ConditionToken = {
  type: TokenType.CONDITION;
  parts: [string];
}

export type BlockOpenToken = { type: TokenType.BLOCK_OPEN }
export type BlockCloseToken = { type: TokenType.BLOCK_CLOSE }

export type EOFToken = {
  type: TokenType.EOF
}