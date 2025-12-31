import { TokenType } from './token-type.enum';

export type Token =
  | TagOpenNameToken
  | TagOpenEndToken
  | TagSelfCloseToken
  | TagCloseNameToken
  | TagCloseEndToken
  | AttributeToken
  | EventToken
  | TextToken

export type TokenBase = {
  type: TokenType;
  parts: string[];
}

export type TagOpenNameToken = TokenBase & {
  type: TokenType.TAG_OPEN_NAME;
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

export type TagSelfCloseToken = TokenBase & {
  type: TokenType.TAG_SELF_CLOSE,
  parts: []
}

export type TagCloseNameToken = TokenBase & {
  type: TokenType.TAG_CLOSE_NAME,
  parts: [string]
}

export type TagCloseEndToken = TokenBase & {
  type: TokenType.TAG_CLOSE_END,
  parts: []
}