import { Dictionary } from '@xendar/common';
import { EOF } from '../costants/chars.constants';
import { Cursor } from './models/cursor.model';
import { LexerState } from './models/lexer-state.enum';
import { TokenType } from './models/token-type.enum';
import { Token } from './models/token.type';
import { LexerTransitionFunction } from './models/transition-function.type';
import { consumeInterpolation } from './states/interpolation.model';
import { consumeTagClose } from './states/tag-close.model';
import { consumeTagOpen } from './states/tag-open.model';
import { consumeText } from './states/text.model';

/**
 * Utility class that emulates a cursor navigating through a template string.
 *
 * The cursor keeps track of the current character, its absolute position
 * within the text, and its logical position expressed as row and column.
 * This is useful when parsing or analyzing template content character by character.
 */
export class Lexer {

  private readonly _cursor;

  private eof = false;

  private readonly _tokens = new Array<Token>;

  private _state = LexerState.START;

  private readonly _states: Dictionary<LexerState, LexerTransitionFunction> = {
    [LexerState.START]: consumeText,
    [LexerState.TAG_OPEN]: consumeTagOpen,
    [LexerState.TEXT]: consumeText,
    [LexerState.TAG_CLOSE]: consumeTagClose,
    [LexerState.INTERPOLATION]: consumeInterpolation
  }

  /**
   * Creates a new Cursor instance for the given template content.
   *
   * @param input The full template text that the cursor will navigate.
   */
  constructor(public input: string) {
    this._cursor = new Cursor(this.input);
  }

  public tokenize(): Token[] {
    while (!this.eof) {
      try {
        const transitionFunction = this._states[this._state];
        const { state, tokens } = transitionFunction!(this._cursor);

        if (tokens?.length) {
          this._tokens.push(...tokens);
        }

        this._state = state;
      } catch (err) {
        const error = err as Error;
        if (error.cause === EOF) {
          this.eof = true;
        } else {
          throw err;
        }
      }
    }

    return this._tokens;
  }
}