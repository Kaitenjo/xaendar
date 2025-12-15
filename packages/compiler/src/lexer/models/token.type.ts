import { TokenType } from './token-type.enum';

export type Token =
  | TagOpenStartToken
  | TagOpenEndToken
  | AttributeToken
  | EventToken
  | TextToken

export type TokenBase = {
  type: TokenType;
  parts: string[];
}

export type TagOpenStartToken = TokenBase & {
  type: TokenType.TAG_OPEN_START;
  parts: [string];
}

export type EventToken = TokenBase & {
  type: TokenType.EVENT
  parts: [string]
}

export type AttributeToken = TokenBase & {
  type: TokenType.ATTRIBUTE
  parts: [string]
}

export type TextToken = TokenBase & {
  type: TokenType.TEXT,
  parts: [string]
}

export type TagOpenEndToken = TokenBase & {
  type: TokenType.TAG_OPEN_END,
  parts: []
}