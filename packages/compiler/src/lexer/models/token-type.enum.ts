export const enum TokenType {
  TAG_OPEN_START,        // <tag
  TAG_OPEN_END,          // >
  TAG_SELF_CLOSE,        // />
  TAG_CLOSE,             // </tag>
  ATTRIBUTE,        // name
  EVENT,            // (click)
  INTERPOLATION,         // {{ ... }}
  TEXT,                  // testo normale
  EOF                    // fine input
}