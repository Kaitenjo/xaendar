export enum TokenType {
  TEXT,

  TAG_OPEN_NAME,      // <div
  TAG_SELF_CLOSE,     // />

  TAG_CLOSE_NAME,     // </div

  ATTRIBUTE,
  EVENT,

  INTERPOLATION_START,
  INTERPOLATION_CONTENT,
  INTERPOLATION_END,

  EOF
}
