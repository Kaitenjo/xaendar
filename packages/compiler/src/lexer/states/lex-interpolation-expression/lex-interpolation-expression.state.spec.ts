import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexInterpolationExpression } from './lex-interpolation-expression.state';

describe('lexInterpolationExpression', () => {
  it('restores the TEXT state and trims trailing whitespace', () => {
    const cursor = new LexerCursor('value }');
    const context: LexerTransitionFunctionContext = { history: [LexerState.TEXT], tokens: [] };
    expect(lexInterpolationExpression(cursor, context)).toEqual({
      state: LexerState.TEXT,
      tokens: [{ type: TokenType.INTERPOLATION_EXPRESSION, parts: ['value'] }],
      popState: true
    });
  });

  it('restores the TAG_BODY state', () => {
    const cursor = new LexerCursor('value}');
    const context: LexerTransitionFunctionContext = { history: [LexerState.TAG_BODY], tokens: [] };
    expect(lexInterpolationExpression(cursor, context).state).toBe(LexerState.TAG_BODY);
  });

  it('consumes the trailing double quote and restores TAG_BODY for an ATTRIBUTE interpolation', () => {
    const cursor = new LexerCursor('value}"');
    const context: LexerTransitionFunctionContext = { history: [LexerState.ATTRIBUTE], tokens: [] };
    expect(lexInterpolationExpression(cursor, context).state).toBe(LexerState.TAG_BODY);
  });

  it('restores CONDITIONAL_BINDING_BODY for an ATTRIBUTE interpolation nested in a conditional binding', () => {
    const cursor = new LexerCursor('value}"');
    const context: LexerTransitionFunctionContext = { history: [LexerState.TAG_OPEN_NAME, LexerState.FLOW_CONTROL_BLOCK, LexerState.ATTRIBUTE], tokens: [] };
    expect(lexInterpolationExpression(cursor, context).state).toBe(LexerState.CONDITIONAL_BINDING_BODY);
  });

  it('throws when an ATTRIBUTE interpolation is not followed by a double quote', () => {
    const cursor = new LexerCursor('value}x');
    const context: LexerTransitionFunctionContext = { history: [LexerState.ATTRIBUTE], tokens: [] };
    expect(() => lexInterpolationExpression(cursor, context)).toThrow('Interpolation must end with double quotes \'"\', found \'x\'');
  });

  it('throws for an unexpected previous state', () => {
    const cursor = new LexerCursor('value}');
    const context: LexerTransitionFunctionContext = { history: [LexerState.EVENT], tokens: [] };
    expect(() => lexInterpolationExpression(cursor, context)).toThrow('Unexpected state \'event\' after interpolation expression');
  });

  it('tracks nested braces to find the matching closing brace', () => {
    const cursor = new LexerCursor('{nested}}');
    const context: LexerTransitionFunctionContext = { history: [LexerState.TEXT], tokens: [] };
    expect(lexInterpolationExpression(cursor, context)).toEqual({
      state: LexerState.TEXT,
      tokens: [{ type: TokenType.INTERPOLATION_EXPRESSION, parts: ['{nested}'] }],
      popState: true
    });
  });

  it.each([
    ['a template literal followed by a space', '`text` }', '`text`'],
    ['a template literal followed by other operands', '`a` + b }', '`a` + b'],
    ['a closing brace in a single-quoted string', '\'}\' }', '\'}\''],
    ['an opening brace in a double-quoted string', '"{" }', '"{"'],
    ['an escaped quote in a string', '\'\\\'}\' }', '\'\\\'}\''],
    ['the other quote in a string', '"it\'s }" }', '"it\'s }"'],
    ['braces and quotes in a template literal', '`} { \' "` }', '`} { \' "`'],
    ['an escaped backtick and dollar in a template literal', '`\\` \\${x}` }', '`\\` \\${x}`'],
    ['a dollar not starting a substitution', '`$ {` }', '`$ {`'],
    ['a substitution', '`a ${ b } c` }', '`a ${ b } c`'],
    ['an object literal in a substitution', '`${ { a: 1 }.a }` }', '`${ { a: 1 }.a }`'],
    ['a nested template literal', '`a ${ `b ${ c }` } d` }', '`a ${ `b ${ c }` } d`'],
    ['a string with a brace in a substitution', '`${ \'}\' }` }', '`${ \'}\' }`']
  ])('reads %s as part of the expression', (_name, input, expression) => {
    const context: LexerTransitionFunctionContext = { history: [LexerState.TEXT], tokens: [] };
    expect(lexInterpolationExpression(new LexerCursor(input), context).tokens).toEqual([{ type: TokenType.INTERPOLATION_EXPRESSION, parts: [expression] }]);
  });
});
