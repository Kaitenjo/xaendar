export enum LexerState {
  START = 'start',           
  TEXT = 'text',
  TAG_OPEN_NAME = 'tag-open-name',   
  TAG_OPEN_BODY = 'tag-open-body',
  TAG_CLOSE_NAME = 'tag-close-name',
  INTERPOLATION_START = 'interpolation-start',
  INTERPOLATION_BODY = 'interpolation-body', 
  INTERPOLATION_END = 'interpolation-end'
}
