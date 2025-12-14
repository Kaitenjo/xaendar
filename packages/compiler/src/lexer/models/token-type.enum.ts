export const enum TokenType {
  TAG_OPEN_START,        // <tag
  TAG_OPEN_END,          // >
  TAG_SELF_CLOSE,        // />
  TAG_CLOSE,             // </tag>
  ATTRIBUTE_NAME,        // name
  ATTRIBUTE_VALUE,       // "value" o 'value'
  EVENT_NAME,            // (click)
  EVENT_BIND,            // = ...
  INTERPOLATION,         // {{ ... }}
  TEXT,                  // testo normale
  EOF                    // fine input
}