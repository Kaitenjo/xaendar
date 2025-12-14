export enum LexerState {
  NONE,
  TEXT,                  // sto leggendo testo libero
  TAG_NAME,              // sto leggendo il nome del tag
  TAG_BODY,        // sto leggendo gli attributi
  TAG_CLOSE,             // sto leggendo '>' o '/>'
  INTERPOLATION_START,   // '{'
  INTERPOLATION_CONTENT, // contenuto dentro '{ ... }'
  INTERPOLATION_END      // '}'
}