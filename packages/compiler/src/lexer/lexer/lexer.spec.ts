import { describe, expect, it } from 'vitest';
import { TokenType } from '../types/token-type.enum';
import { Lexer } from './lexer';

describe('Lexer', () => {
  it('tokenizes a simple element with text content', () => {
    const tokens = new Lexer('<div>Hello</div>').tokenize();
    expect(tokens.map(t => t.type)).toEqual([
      TokenType.TAG_OPEN_NAME,
      TokenType.TAG_OPEN_END,
      TokenType.TEXT,
      TokenType.TAG_CLOSE_NAME
    ]);
    expect(tokens.every(t => t.span)).toBe(true);
  });

  it('tokenizes an attribute and an event binding', () => {
    const tokens = new Lexer('<button class="a" @click="onClick()"></button>').tokenize();
    expect(tokens.map(t => t.type)).toEqual([
      TokenType.TAG_OPEN_NAME,
      TokenType.ATTRIBUTE,
      TokenType.ATTRIBUTE_VALUE,
      TokenType.EVENT,
      TokenType.EVENT_HANDLER,
      TokenType.TAG_OPEN_END,
      TokenType.TAG_CLOSE_NAME
    ]);
  });

  it('tokenizes directives with and without bindings', () => {
    const tokens = new Lexer('<div @@first @@second(display="{display()}" disabled @change="onChange($event)") class="a"></div>').tokenize();
    expect(tokens.map(t => t.type)).toEqual([
      TokenType.TAG_OPEN_NAME,
      TokenType.DIRECTIVE,
      TokenType.DIRECTIVE_CLOSE,
      TokenType.DIRECTIVE,
      TokenType.ATTRIBUTE,
      TokenType.INTERPOLATION_EXPRESSION,
      TokenType.ATTRIBUTE,
      TokenType.EVENT,
      TokenType.EVENT_HANDLER,
      TokenType.EVENT_PARAMETER,
      TokenType.DIRECTIVE_CLOSE,
      TokenType.ATTRIBUTE,
      TokenType.ATTRIBUTE_VALUE,
      TokenType.TAG_OPEN_END,
      TokenType.TAG_CLOSE_NAME
    ]);
  });

  it('tokenizes a directive declared inside a conditional binding', () => {
    const tokens = new Lexer('<div @(cond(), @@first @@second(display="block") @@third) class="a"></div>').tokenize();
    expect(tokens.map(t => t.type)).toEqual([
      TokenType.TAG_OPEN_NAME,
      TokenType.CONDITIONAL_BINDING,
      TokenType.DIRECTIVE,
      TokenType.DIRECTIVE_CLOSE,
      TokenType.DIRECTIVE,
      TokenType.ATTRIBUTE,
      TokenType.ATTRIBUTE_VALUE,
      TokenType.DIRECTIVE_CLOSE,
      TokenType.DIRECTIVE,
      TokenType.DIRECTIVE_CLOSE,
      TokenType.CONDITIONAL_BINDING_CLOSE,
      TokenType.ATTRIBUTE,
      TokenType.ATTRIBUTE_VALUE,
      TokenType.TAG_OPEN_END,
      TokenType.TAG_CLOSE_NAME
    ]);
  });

  it('tokenizes a conditional binding declared inside a directive', () => {
    const tokens = new Lexer('<div @@myDirective(display="block" @(cond(), position="{position()}" disabled @(inner(), @change="onChange()")) label="x") class="a"></div>').tokenize();
    expect(tokens.map(t => t.type)).toEqual([
      TokenType.TAG_OPEN_NAME,
      TokenType.DIRECTIVE,
      TokenType.ATTRIBUTE,
      TokenType.ATTRIBUTE_VALUE,
      TokenType.CONDITIONAL_BINDING,
      TokenType.ATTRIBUTE,
      TokenType.INTERPOLATION_EXPRESSION,
      TokenType.ATTRIBUTE,
      TokenType.CONDITIONAL_BINDING,
      TokenType.EVENT,
      TokenType.EVENT_HANDLER,
      TokenType.CONDITIONAL_BINDING_CLOSE,
      TokenType.CONDITIONAL_BINDING_CLOSE,
      TokenType.ATTRIBUTE,
      TokenType.ATTRIBUTE_VALUE,
      TokenType.DIRECTIVE_CLOSE,
      TokenType.ATTRIBUTE,
      TokenType.ATTRIBUTE_VALUE,
      TokenType.TAG_OPEN_END,
      TokenType.TAG_CLOSE_NAME
    ]);
  });

  it('throws for a directive declared inside another directive, even through a conditional binding', () => {
    expect(() => new Lexer('<div @@first(@@second)></div>').tokenize()).toThrow('Directives cannot be declared inside another directive');
    expect(() => new Lexer('<div @@first(@(cond(), @@second))></div>').tokenize()).toThrow('Directives cannot be declared inside another directive');
  });

  it('throws for a ) with nothing to close', () => {
    expect(() => new Lexer('<div class) id="a"></div>').tokenize()).toThrow('there is no conditional binding or directive to close');
  });

  it('formats a thrown Error with position and source context', () => {
    let caught: unknown;
    try {
      new Lexer('<div =\"x\">').tokenize();
    } catch (err) {
      caught = err;
    }

    expect(typeof caught).toBe('string');
    expect(caught as string).toContain('[Lexer]');
    expect(caught as string).toContain('Attribute cannot start with \'=\'');
  });

  it('formats a thrown string error consumed after several characters', () => {
    let caught: unknown;
    try {
      new Lexer('<button @click="onClick foo()"></button>').tokenize();
    } catch (err) {
      caught = err;
    }

    expect(typeof caught).toBe('string');
    expect(caught as string).toContain('No spaces are allowed in event handler name');
  });

  it('stops the backward neighbourhood scan at a line break', () => {
    let caught: unknown;
    try {
      new Lexer('<div>\n<button @click="onClick foo()"></button>').tokenize();
    } catch (err) {
      caught = err;
    }

    expect(typeof caught).toBe('string');
    expect(caught as string).toContain('No spaces are allowed in event handler name');
  });

  it('formats an error near the very start of the template', () => {
    let caught: unknown;
    try {
      new Lexer('< >').tokenize();
    } catch (err) {
      caught = err;
    }

    expect(typeof caught).toBe('string');
    expect(caught as string).toContain('Tag name cannot be empty');
  });

  it('stops the forward neighbourhood scan at a line break', () => {
    let caught: unknown;
    try {
      new Lexer('<button @click="onClick foo()"></button>\nmore text after the error').tokenize();
    } catch (err) {
      caught = err;
    }

    expect(typeof caught).toBe('string');
    expect(caught as string).toContain('[Lexer]');
  });
});
