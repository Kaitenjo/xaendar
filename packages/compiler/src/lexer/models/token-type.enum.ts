export enum TokenType {
  TEXT,

  TAG_OPEN_NAME,      // <div
  TAG_SELF_CLOSE,     // />
  TAG_CLOSE,

  TAG_CLOSE_NAME,     // </div

  ATTRIBUTE,
  EVENT,

  INTERPOLATION_LITERAL,
  INTERPOLATION_EXPRESSION,

  EOF
}
