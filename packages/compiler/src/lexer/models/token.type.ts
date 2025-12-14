import { TokenType } from './token-type.enum';

export type Token =
  | TagOpenStartToken
  | TagOpenEndToken
  | TagSelfClosingToken
  | TagCloseToken
  | IncompleteTagOpenToken
  | TextToken
  | InterpolationToken
  | EncodedEntityToken
  | CommentStartToken
  | CommentEndToken
  | CdataStartToken
  | CdataEndToken
  | AttributeNameToken
  | AttributeQuoteToken
  | AttributeValueTextToken
  | AttributeValueInterpolationToken
  | DocTypeToken
  | ExpansionFormStartToken
  | ExpansionCaseValueToken
  | ExpansionCaseExpressionStartToken
  | ExpansionCaseExpressionEndToken
  | ExpansionFormEndToken
  | EndOfFileToken
  | BlockParameterToken
  | BlockOpenStartToken
  | BlockOpenEndToken
  | BlockCloseToken
  | IncompleteBlockOpenToken
  | LetStartToken
  | LetValueToken
  | LetEndToken
  | IncompleteLetToken
  | ComponentOpenStartToken
  | ComponentOpenEndToken
  | ComponentOpenEndVoidToken
  | ComponentCloseToken
  | IncompleteComponentOpenToken
  | DirectiveNameToken
  | DirectiveOpenToken
  | DirectiveCloseToken;

export type TokenBase = {
  type: TokenType;
  parts: string[];
}

export type TagOpenStartToken = TokenBase & {
  type: TokenType.TAG_OPEN_START;
  parts: [string];
}

export type TagOpenEndToken = TokenBase & {
  type: TokenType.TAG_OPEN_END;
  parts: [];
}

export type TagSelfClosingToken = TokenBase & {
  type: TokenType.TAG_OPEN_END_VOID;
  parts: [];
}

export type TagCloseToken = TokenBase & {
  type: TokenType.TAG_CLOSE;
  parts: [prefix: string, name: string];
}

export type IncompleteTagOpenToken = TokenBase & {
  type: TokenType.INCOMPLETE_TAG_OPEN;
  parts: [prefix: string, name: string];
}

export type TextToken = TokenBase & {
  type: TokenType.TEXT | TokenType.ESCAPABLE_RAW_TEXT | TokenType.RAW_TEXT;
  parts: [text: string];
}

export type InterpolationToken = TokenBase & {
  type: TokenType.INTERPOLATION;
  parts:
    | [startMarker: string, expression: string, endMarker: string]
    | [startMarker: string, expression: string];
}

export type EncodedEntityToken = TokenBase & {
  type: TokenType.ENCODED_ENTITY;
  parts: [decoded: string, encoded: string];
}

export type CommentStartToken = TokenBase & {
  type: TokenType.COMMENT_START;
  parts: [];
}

export type CommentEndToken = TokenBase & {
  type: TokenType.COMMENT_END;
  parts: [];
}

export type CdataStartToken = TokenBase & {
  type: TokenType.CDATA_START;
  parts: [];
}

export type CdataEndToken = TokenBase & {
  type: TokenType.CDATA_END;
  parts: [];
}

export type AttributeNameToken = TokenBase & {
  type: TokenType.ATTR_NAME;
  parts: [prefix: string, name: string];
}

export type AttributeQuoteToken = TokenBase & {
  type: TokenType.ATTR_QUOTE;
  parts: [quote: "'" | '"'];
}

export type AttributeValueTextToken = TokenBase & {
  type: TokenType.ATTR_VALUE_TEXT;
  parts: [value: string];
}

export type AttributeValueInterpolationToken = TokenBase & {
  type: TokenType.ATTR_VALUE_INTERPOLATION;
  parts:
    | [startMarker: string, expression: string, endMarker: string]
    | [startMarker: string, expression: string];
}

export type DocTypeToken = TokenBase & {
  type: TokenType.DOC_TYPE;
  parts: [content: string];
}

export type ExpansionFormStartToken = TokenBase & {
  type: TokenType.EXPANSION_FORM_START;
  parts: [];
}

export type ExpansionCaseValueToken = TokenBase & {
  type: TokenType.EXPANSION_CASE_VALUE;
  parts: [value: string];
}

export type ExpansionCaseExpressionStartToken = TokenBase & {
  type: TokenType.EXPANSION_CASE_EXP_START;
  parts: [];
}

export type ExpansionCaseExpressionEndToken = TokenBase & {
  type: TokenType.EXPANSION_CASE_EXP_END;
  parts: [];
}

export type ExpansionFormEndToken = TokenBase & {
  type: TokenType.EXPANSION_FORM_END;
  parts: [];
}

export type EndOfFileToken = TokenBase & {
  type: TokenType.EOF;
  parts: [];
}

export type BlockParameterToken = TokenBase & {
  type: TokenType.BLOCK_PARAMETER;
  parts: [expression: string];
}

export type BlockOpenStartToken = TokenBase & {
  type: TokenType.BLOCK_OPEN_START;
  parts: [name: string];
}

export type BlockOpenEndToken = TokenBase & {
  type: TokenType.BLOCK_OPEN_END;
  parts: [];
}

export type BlockCloseToken = TokenBase & {
  type: TokenType.BLOCK_CLOSE;
  parts: [];
}

export type IncompleteBlockOpenToken = TokenBase & {
  type: TokenType.INCOMPLETE_BLOCK_OPEN;
  parts: [name: string];
}

export type LetStartToken = TokenBase & {
  type: TokenType.LET_START;
  parts: [name: string];
}

export type LetValueToken = TokenBase & {
  type: TokenType.LET_VALUE;
  parts: [value: string];
}

export type LetEndToken = TokenBase & {
  type: TokenType.LET_END;
  parts: [];
}

export type IncompleteLetToken = TokenBase & {
  type: TokenType.INCOMPLETE_LET;
  parts: [name: string];
}

export type ComponentOpenStartToken = TokenBase & {
  type: TokenType.COMPONENT_OPEN_START;
  parts: [componentName: string, prefix: string, tagName: string];
}

export type ComponentOpenEndToken = TokenBase & {
  type: TokenType.COMPONENT_OPEN_END;
  parts: [];
}

export type ComponentOpenEndVoidToken = TokenBase & {
  type: TokenType.COMPONENT_OPEN_END_VOID;
  parts: [];
}

export type ComponentCloseToken = TokenBase & {
  type: TokenType.COMPONENT_CLOSE;
  parts: [componentName: string, prefix: string, tagName: string];
}

export type IncompleteComponentOpenToken = TokenBase & {
  type: TokenType.INCOMPLETE_COMPONENT_OPEN;
  parts: [componentName: string, prefix: string, tagName: string];
}

export type DirectiveNameToken = TokenBase & {
  type: TokenType.DIRECTIVE_NAME;
  parts: [name: string];
}

export type DirectiveOpenToken = TokenBase & {
  type: TokenType.DIRECTIVE_OPEN;
  parts: [];
}

export type DirectiveCloseToken = TokenBase & {
  type: TokenType.DIRECTIVE_CLOSE;
  parts: [];
}
