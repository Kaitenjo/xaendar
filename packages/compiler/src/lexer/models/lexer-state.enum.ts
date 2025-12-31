export enum LexerState {
  START = 'start',           
  TEXT = 'text',
  TAG_OPEN = 'tag-open',   
  TAG_CLOSE = 'tag-close',
  INTERPOLATION = 'interpolation'
}
