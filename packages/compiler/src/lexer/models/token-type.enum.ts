export enum TokenType {
  TEXT,

  TAG_OPEN_NAME,      // <div
  TAG_SELF_CLOSE,     // />
  TAG_OPEN_END,

  TAG_CLOSE_NAME,     // </div

  ATTRIBUTE,
  EVENT,

  INTERPOLATION_LITERAL,
  INTERPOLATION_EXPRESSION,

  EOF
}
