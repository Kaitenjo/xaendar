import { TokenType } from './token-type.enum';

export type Token =
  | TagOpenStartToken

export type TokenBase = {
  type: TokenType;
  parts: string[];
}

export type TagOpenStartToken = TokenBase & {
  type: TokenType.TAG_OPEN_START;
  parts: [string];
}