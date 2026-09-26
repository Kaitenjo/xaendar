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
