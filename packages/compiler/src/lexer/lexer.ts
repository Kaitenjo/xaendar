import { Stack } from '@xaendar/common';
import { Dictionary } from '@xaendar/types';
import { EOF } from '../costants/chars.constants.js';
import { LexerCursor } from './models/lexer-cursor.model.js';
import { LexerState } from './models/lexer-state.enum.js';
import { Token } from './models/token.type.js';
import { LexerTransitionFunction } from './models/transition-function/transition-function.type.js';
import { consumeAttribute } from './states/attribute.state.js';
import { consumeEvent } from './states/event.state.js';
import { consumeFlowControl } from './states/flow-control.js';
import { consumeFlowControlBlock } from './states/flow-control-block.state.js';
import { consumeFlowControlCondition } from './states/flow-control-condition.state.js';
import { consumeInterpolationExpression } from './states/interpolation-expression.state.js';
import { consumeInterpolationliteral } from './states/interpolation-literal.state.js';
import { consumeInterpolation } from './states/interpolation.state.js';
import { consumeTagBody } from './states/tag-body.state.js';
import { consumeTagClose } from './states/tag-close.state.js';
import { consumeTagOpenEnd } from './states/tag-open-end.state.js';
import { consumeTagOpenName } from './states/tag-open-name.state.js';
import { consumeText } from './states/text.state.js';

/**
 * Utility class that emulates a cursor navigating through a template string.
 *
 * The cursor keeps track of the current character, its absolute position
 * within the text, and its logical position expressed as row and column.
 * This is useful when parsing or analyzing template content character by character.
 */
export class Lexer {

  private readonly _cursor: LexerCursor;

  private _state = LexerState.START;

  private _stack = new Stack<LexerState>;

  private readonly _tokens = new Array<Token>;

  private readonly _states: Dictionary<LexerState, LexerTransitionFunction> = {
    [LexerState.START]: consumeText,
    [LexerState.TEXT]: consumeText,
    [LexerState.TAG_OPEN_NAME]: consumeTagOpenName,
    [LexerState.TAG_BODY]: consumeTagBody,
    [LexerState.TAG_OPEN_END]: consumeTagOpenEnd,
    [LexerState.TAG_CLOSE]: consumeTagClose,
    [LexerState.ATTRIBUTE]: consumeAttribute,
    [LexerState.FLOW_CONTROL]: consumeFlowControl,
    [LexerState.FLOW_CONTROL_CONDITION]: consumeFlowControlCondition,
    [LexerState.FLOW_CONTROL_BLOCK]: consumeFlowControlBlock,
    [LexerState.EVENT]: consumeEvent,
    [LexerState.INTERPOLATION]: consumeInterpolation,
    [LexerState.INTERPOLATION_EXPRESSION]: consumeInterpolationExpression,
    [LexerState.INTERPOLATION_LITERAL]: consumeInterpolationliteral
  }

  /**
   * Creates a new Cursor instance for the given template content.
   *
   * @param input The full template text that the cursor will navigate.
   */
  constructor(public input: string) {
    this._cursor = new LexerCursor(this.input);
  }

  public tokenize(): Token[] {
    let eof = false;

    while (!eof) {
      try {
        const transitionFunction = this._states[this._state];
        const { state, tokens, popState, pushState } = transitionFunction!(this._cursor, { history: this._stack.values });
        
        if (tokens?.length) {
          this._tokens.push(...tokens);
        }
        
        if (pushState) {
          this._stack.push(this._state);
        }
        
        if (popState) {
          this._stack.pop();
        } 
        
        this._state = state;
      } catch (err) {
        const error = err as Error;
        if (error.cause === EOF) {
          eof = true;
        } else {
          throw err;
        }
      }
    }

    return this._tokens;
  }
}