export enum LexerState {
  START = 'start',           
  TEXT = 'text',
  TAG_OPEN_NAME = 'tag-open-name',
  TAG_BODY  = 'tag-body',
  TAG_OPEN_END = 'tag-open-end',
  TAG_CLOSE = 'tag-close',
  ATTRIBUTE = 'attribute',
  EVENT = 'event',
  FLOW_CONTROL = 'flow-control',
  FLOW_CONTROL_CONDITION = 'flow-control-condition',
  FLOW_CONTROL_BLOCK = 'flow-control-block',
  INTERPOLATION = 'interpolation',
  INTERPOLATION_EXPRESSION = 'interpolation-expression',
  INTERPOLATION_LITERAL = 'interpolation-literal'
}
