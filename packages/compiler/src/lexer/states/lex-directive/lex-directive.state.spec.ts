import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexDirective, lexStructuralDirective } from './lex-directive.state';

const context: LexerTransitionFunctionContext = { history: [LexerState.TAG_OPEN_NAME], tokens: [] };
const conditionalBindingContext: LexerTransitionFunctionContext = { history: [LexerState.TAG_OPEN_NAME, LexerState.FLOW_CONTROL_BLOCK], tokens: [] };

/**
 * Creates a cursor positioned right after the `@@` of the given input, as the tag body leaves it.
 */
function afterAtSigns(input: string): LexerCursor {
  const cursor = new LexerCursor(input);
  cursor.advance(2);
  return cursor;
}

describe('lexDirective', () => {
  it('emits the directive and opens its body on (', () => {
    const cursor = afterAtSigns('@@myDirective(display="block")');
    expect(lexDirective(cursor, context)).toEqual({
      state: LexerState.DIRECTIVE_BODY,
      tokens: [{ type: TokenType.DIRECTIVE, parts: ['myDirective'] }],
      pushState: true
    });
    expect(cursor.peek()).toBe('d'.charCodeAt(0));
  });

  it('emits the directive and its closure when declared without bindings and followed by a space', () => {
    const cursor = afterAtSigns('@@myDirective class="a"');
    expect(lexDirective(cursor, context)).toEqual({
      state: LexerState.TAG_BODY,
      tokens: [
        { type: TokenType.DIRECTIVE, parts: ['myDirective'] },
        { type: TokenType.DIRECTIVE_CLOSE }
      ]
    });
    expect(cursor.peek()).toBe(' '.charCodeAt(0));
  });

  it.each([
    ['a tab', '\t'],
    ['a line feed', '\n'],
    ['a carriage return', '\r']
  ])('emits the directive and its closure when declared without bindings and followed by %s', (_description, whitespace) => {
    const cursor = afterAtSigns(`@@myDirective${whitespace}class="a"`);
    expect(lexDirective(cursor, context)).toEqual({
      state: LexerState.TAG_BODY,
      tokens: [
        { type: TokenType.DIRECTIVE, parts: ['myDirective'] },
        { type: TokenType.DIRECTIVE_CLOSE }
      ]
    });
    expect(cursor.peek()).toBe(whitespace.charCodeAt(0));
  });

  it('emits the directive and its closure when declared without bindings and followed by >', () => {
    const cursor = afterAtSigns('@@myDirective>');
    expect(lexDirective(cursor, context).tokens?.map(token => token.type)).toEqual([TokenType.DIRECTIVE, TokenType.DIRECTIVE_CLOSE]);
  });

  it('emits the directive and its closure when declared without bindings and followed by /', () => {
    const cursor = afterAtSigns('@@myDirective/>');
    expect(lexDirective(cursor, context).tokens?.map(token => token.type)).toEqual([TokenType.DIRECTIVE, TokenType.DIRECTIVE_CLOSE]);
  });

  it('goes back to CONDITIONAL_BINDING_BODY when declared without bindings inside a conditional binding', () => {
    const cursor = afterAtSigns('@@myDirective class="a" }');
    expect(lexDirective(cursor, conditionalBindingContext).state).toBe(LexerState.CONDITIONAL_BINDING_BODY);
  });

  it('leaves the } closing the block of the conditional binding it is declared in to the conditional binding body', () => {
    const cursor = afterAtSigns('@@myDirective}');
    expect(lexDirective(cursor, conditionalBindingContext)).toEqual({
      state: LexerState.CONDITIONAL_BINDING_BODY,
      tokens: [
        { type: TokenType.DIRECTIVE, parts: ['myDirective'] },
        { type: TokenType.DIRECTIVE_CLOSE }
      ]
    });
    expect(cursor.peek()).toBe('}'.charCodeAt(0));
  });

  it('throws on } outside of a conditional binding', () => {
    expect(() => lexDirective(afterAtSigns('@@myDirective}'), context)).toThrow('Unexpected \'}\': there is no conditional binding to close');
  });

  it.each([
    ['in the tag body', context],
    ['in a block of a conditional binding', conditionalBindingContext]
  ])('throws on ), which has no directive to close, %s', (_description, outerContext) => {
    expect(() => lexDirective(afterAtSigns('@@myDirective)'), outerContext)).toThrow('Unexpected \')\': there is no directive to close');
  });

  it('throws when the selector is empty', () => {
    expect(() => lexDirective(afterAtSigns('@@(display="block")'), context)).toThrow('Directive selector cannot be empty');
  });

  it('throws when the selector is empty and the directive has no bindings', () => {
    expect(() => lexDirective(afterAtSigns('@@ class="a"'), context)).toThrow('Directive selector cannot be empty');
  });

  it('throws when the bindings are not declared between parentheses', () => {
    expect(() => lexDirective(afterAtSigns('@@myDirective="block"'), context)).toThrow('Directive bindings must be declared between parentheses');
  });
});

describe('lexStructuralDirective', () => {
  /**
   * Creates a cursor positioned right after the `*` of the given input, as the tag body leaves it.
   */
  function afterStar(input: string): LexerCursor {
    const cursor = new LexerCursor(input);
    cursor.advance();
    return cursor;
  }

  it('emits the structural directive and opens its body on (', () => {
    const cursor = afterStar('*hasRole(role="admin")');
    expect(lexStructuralDirective(cursor, context)).toEqual({
      state: LexerState.DIRECTIVE_BODY,
      tokens: [{ type: TokenType.STRUCTURAL_DIRECTIVE, parts: ['hasRole'] }],
      pushState: true
    });
    expect(cursor.peek()).toBe('r'.charCodeAt(0));
  });

  it('emits the structural directive and its closure when declared without bindings', () => {
    const cursor = afterStar('*hasRole class="a"');
    expect(lexStructuralDirective(cursor, context)).toEqual({
      state: LexerState.TAG_BODY,
      tokens: [
        { type: TokenType.STRUCTURAL_DIRECTIVE, parts: ['hasRole'] },
        { type: TokenType.DIRECTIVE_CLOSE }
      ]
    });
  });

  it('leaves the } closing the block of the conditional binding it is declared in to the conditional binding body', () => {
    const cursor = afterStar('*hasRole}');
    expect(lexStructuralDirective(cursor, conditionalBindingContext).state).toBe(LexerState.CONDITIONAL_BINDING_BODY);
    expect(cursor.peek()).toBe('}'.charCodeAt(0));
  });

  it('throws when the selector is empty', () => {
    expect(() => lexStructuralDirective(afterStar('* class="a"'), context)).toThrow('Directive selector cannot be empty');
  });

  it('throws when the bindings are not declared between parentheses', () => {
    expect(() => lexStructuralDirective(afterStar('*hasRole="admin"'), context)).toThrow('Structural directive bindings must be declared between parentheses, e.g. *selector(name="value")');
  });
});

describe('type arguments', () => {
  it.each([
    ['one type', '@@list<string>(items="x")', 'string'],
    ['several types', '@@list<string, number>(items="x")', 'string, number'],
    ['nested generic types', '@@list<Map<string, Array<number>>, Set<T>>(items="x")', 'Map<string, Array<number>>, Set<T>'],
    ['the arrow of a function type', '@@list<(value: string) => void>(items="x")', '(value: string) => void'],
    ['a literal type holding angle brackets', '@@list<\'a>b\' | "<">(items="x")', '\'a>b\' | "<"'],
    ['a template literal type', '@@list<`a>${string}`>(items="x")', '`a>${string}`']
  ])('emits the type arguments as the second part of the directive and opens its body, for %s', (_description, input, typeArguments) => {
    const cursor = new LexerCursor(input);
    cursor.advance(2);

    expect(lexDirective(cursor, context)).toEqual({
      state: LexerState.DIRECTIVE_BODY,
      tokens: [{ type: TokenType.DIRECTIVE, parts: ['list', typeArguments] }],
      pushState: true
    });
    expect(cursor.peek()).toBe('i'.charCodeAt(0));
  });

  it('emits the type arguments of a structural directive', () => {
    const cursor = new LexerCursor('*list<string>(items="x")');
    cursor.advance();

    expect(lexStructuralDirective(cursor, context).tokens).toEqual([{ type: TokenType.STRUCTURAL_DIRECTIVE, parts: ['list', 'string'] }]);
  });

  it('emits the type arguments of a directive declared without bindings, with its closure', () => {
    const cursor = new LexerCursor('@@list<string> class="a"');
    cursor.advance(2);

    expect(lexDirective(cursor, context).tokens).toEqual([
      { type: TokenType.DIRECTIVE, parts: ['list', 'string'] },
      { type: TokenType.DIRECTIVE_CLOSE }
    ]);
  });

  it.each([
    ['empty type arguments', '@@list<>(items="x")', 'The type arguments of a directive cannot be empty'],
    ['blank type arguments', '@@list< >(items="x")', 'The type arguments of a directive cannot be empty'],
    ['a selector that is empty', '@@<string>(items="x")', 'Directive selector cannot be empty'],
    ['type arguments declared twice', '@@list<string><number>(items="x")', 'A directive can declare its type arguments only once, right after its selector'],
    ['something between the type arguments and the bindings', '@@list<string>x(items="x")', 'The type arguments of a directive must be followed by its bindings between parentheses']
  ])('throws for %s', (_description, input, message) => {
    const cursor = new LexerCursor(input);
    cursor.advance(2);

    expect(() => lexDirective(cursor, context)).toThrow(message);
  });

  it('throws when the input ends before the type arguments are closed', () => {
    const cursor = new LexerCursor('@@list<Map<string, number>');
    cursor.advance(2);

    expect(() => lexDirective(cursor, context)).toThrow();
  });
});
