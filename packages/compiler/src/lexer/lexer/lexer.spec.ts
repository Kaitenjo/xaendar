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

  it('tokenizes an if / else if / else conditional binding', () => {
    const tokens = new Lexer('<div @if (a()) { title="x" } @else if (b(1, 2)) { title="{y()}" @click="onClick()" } @else { disabled} class="a"></div>').tokenize();
    expect(tokens.map(t => t.type)).toEqual([
      TokenType.TAG_OPEN_NAME,
      TokenType.IF,
      TokenType.CONDITION,
      TokenType.BLOCK_OPEN,
      TokenType.ATTRIBUTE,
      TokenType.ATTRIBUTE_VALUE,
      TokenType.BLOCK_CLOSE,
      TokenType.ELSE_IF,
      TokenType.CONDITION,
      TokenType.BLOCK_OPEN,
      TokenType.ATTRIBUTE,
      TokenType.INTERPOLATION_EXPRESSION,
      TokenType.EVENT,
      TokenType.EVENT_HANDLER,
      TokenType.BLOCK_CLOSE,
      TokenType.ELSE,
      TokenType.BLOCK_OPEN,
      TokenType.ATTRIBUTE,
      TokenType.BLOCK_CLOSE,
      TokenType.ATTRIBUTE,
      TokenType.ATTRIBUTE_VALUE,
      TokenType.TAG_OPEN_END,
      TokenType.TAG_CLOSE_NAME
    ]);
    expect(tokens.filter(t => t.type === TokenType.CONDITION).map(t => t.parts)).toEqual([['a()'], ['b(1, 2)']]);
  });

  it('tokenizes a switch conditional binding', () => {
    const tokens = new Lexer('<input @switch (mode()) { @case (\'a\') @case (\'b\') { title="x" } @default { title="y" } } />').tokenize();
    expect(tokens.map(t => t.type)).toEqual([
      TokenType.TAG_OPEN_NAME,
      TokenType.SWITCH,
      TokenType.CONDITION,
      TokenType.BLOCK_OPEN,
      TokenType.CASE,
      TokenType.CONDITION,
      TokenType.CASE,
      TokenType.CONDITION,
      TokenType.BLOCK_OPEN,
      TokenType.ATTRIBUTE,
      TokenType.ATTRIBUTE_VALUE,
      TokenType.BLOCK_CLOSE,
      TokenType.DEFAULT,
      TokenType.BLOCK_OPEN,
      TokenType.ATTRIBUTE,
      TokenType.ATTRIBUTE_VALUE,
      TokenType.BLOCK_CLOSE,
      TokenType.BLOCK_CLOSE,
      TokenType.TAG_SELF_CLOSE
    ]);
  });

  it('tokenizes a conditional binding nested in a block of another one', () => {
    const tokens = new Lexer('<div @if (outer()) { title="x" @if (inner()) { id="y" } lang="z" }></div>').tokenize();
    expect(tokens.map(t => t.type)).toEqual([
      TokenType.TAG_OPEN_NAME,
      TokenType.IF,
      TokenType.CONDITION,
      TokenType.BLOCK_OPEN,
      TokenType.ATTRIBUTE,
      TokenType.ATTRIBUTE_VALUE,
      TokenType.IF,
      TokenType.CONDITION,
      TokenType.BLOCK_OPEN,
      TokenType.ATTRIBUTE,
      TokenType.ATTRIBUTE_VALUE,
      TokenType.BLOCK_CLOSE,
      TokenType.ATTRIBUTE,
      TokenType.ATTRIBUTE_VALUE,
      TokenType.BLOCK_CLOSE,
      TokenType.TAG_OPEN_END,
      TokenType.TAG_CLOSE_NAME
    ]);
  });

  it('tokenizes a directive declared inside a conditional binding', () => {
    const tokens = new Lexer('<div @if (cond()) { @@first @@second(display="block") @@third} class="a"></div>').tokenize();
    expect(tokens.map(t => t.type)).toEqual([
      TokenType.TAG_OPEN_NAME,
      TokenType.IF,
      TokenType.CONDITION,
      TokenType.BLOCK_OPEN,
      TokenType.DIRECTIVE,
      TokenType.DIRECTIVE_CLOSE,
      TokenType.DIRECTIVE,
      TokenType.ATTRIBUTE,
      TokenType.ATTRIBUTE_VALUE,
      TokenType.DIRECTIVE_CLOSE,
      TokenType.DIRECTIVE,
      TokenType.DIRECTIVE_CLOSE,
      TokenType.BLOCK_CLOSE,
      TokenType.ATTRIBUTE,
      TokenType.ATTRIBUTE_VALUE,
      TokenType.TAG_OPEN_END,
      TokenType.TAG_CLOSE_NAME
    ]);
  });

  it('tokenizes a conditional binding declared inside a directive', () => {
    const tokens = new Lexer('<div @@myDirective(display="block" @if (cond()) { position="{position()}" disabled @if (inner()) { @change="onChange()" } } label="x") class="a"></div>').tokenize();
    expect(tokens.map(t => t.type)).toEqual([
      TokenType.TAG_OPEN_NAME,
      TokenType.DIRECTIVE,
      TokenType.ATTRIBUTE,
      TokenType.ATTRIBUTE_VALUE,
      TokenType.IF,
      TokenType.CONDITION,
      TokenType.BLOCK_OPEN,
      TokenType.ATTRIBUTE,
      TokenType.INTERPOLATION_EXPRESSION,
      TokenType.ATTRIBUTE,
      TokenType.IF,
      TokenType.CONDITION,
      TokenType.BLOCK_OPEN,
      TokenType.EVENT,
      TokenType.EVENT_HANDLER,
      TokenType.BLOCK_CLOSE,
      TokenType.BLOCK_CLOSE,
      TokenType.ATTRIBUTE,
      TokenType.ATTRIBUTE_VALUE,
      TokenType.DIRECTIVE_CLOSE,
      TokenType.ATTRIBUTE,
      TokenType.ATTRIBUTE_VALUE,
      TokenType.TAG_OPEN_END,
      TokenType.TAG_CLOSE_NAME
    ]);
  });

  it('tells the blocks of a conditional binding apart from the ones holding template content', () => {
    const tokens = new Lexer('@if (shown()) { <div @if (cond()) { title="x" }>text</div> }').tokenize();
    expect(tokens.map(t => t.type)).toEqual([
      TokenType.IF,
      TokenType.CONDITION,
      TokenType.BLOCK_OPEN,
      TokenType.TAG_OPEN_NAME,
      TokenType.IF,
      TokenType.CONDITION,
      TokenType.BLOCK_OPEN,
      TokenType.ATTRIBUTE,
      TokenType.ATTRIBUTE_VALUE,
      TokenType.BLOCK_CLOSE,
      TokenType.TAG_OPEN_END,
      TokenType.TEXT,
      TokenType.TAG_CLOSE_NAME,
      TokenType.BLOCK_CLOSE
    ]);
  });

  it('tokenizes an event sharing its name with a flow-control keyword as an event', () => {
    const tokens = new Lexer('<div @switch="onSwitch()" @default="onDefault()"></div>').tokenize();
    expect(tokens.map(t => t.type)).toEqual([
      TokenType.TAG_OPEN_NAME,
      TokenType.EVENT,
      TokenType.EVENT_HANDLER,
      TokenType.EVENT,
      TokenType.EVENT_HANDLER,
      TokenType.TAG_OPEN_END,
      TokenType.TAG_CLOSE_NAME
    ]);
  });

  it('throws for a directive declared inside another directive, even through a conditional binding', () => {
    expect(() => new Lexer('<div @@first(@@second)></div>').tokenize()).toThrow('Directives cannot be declared inside another directive');
    expect(() => new Lexer('<div @@first(@if (cond()) { @@second })></div>').tokenize()).toThrow('Directives cannot be declared inside another directive');
  });

  it('throws for a ) with nothing to close', () => {
    expect(() => new Lexer('<div class) id="a"></div>').tokenize()).toThrow('there is no directive to close');
    expect(() => new Lexer('<div @if (cond()) { title="x" )></div>').tokenize()).toThrow('there is no directive to close');
  });

  it('throws for a } with nothing to close', () => {
    expect(() => new Lexer('<div class} id="a"></div>').tokenize()).toThrow('there is no conditional binding to close');
    expect(() => new Lexer('<div @@myDirective(display="block" }></div>').tokenize()).toThrow('there is no conditional binding to close');
  });

  it('throws when the tag ends before a block of a conditional binding is closed', () => {
    expect(() => new Lexer('<div @if (cond()) { title="x"></div>').tokenize()).toThrow('Conditional binding blocks must be closed by \'}\'');
  });

  describe('tags spanning multiple lines', () => {
    const describeTokens = (template: string) => new Lexer(template).tokenize().map(token => ({
      type: TokenType[token.type],
      parts: 'parts' in token ? token.parts : []
    }));

    // Joined by a space, the lines declare the tag on a single line
    const lines = [
      '<app-sidebar',
      'collapsed',
      'title="{title()}"',
      '@collapsedChange="onCollapse($event, 1)"',
      '@@tooltip',
      '@@popover(',
      'text="a"',
      '@shown="onShown()"',
      ')',
      '@if (dark()) {',
      'class="dark"',
      'hidden',
      '} @else if (dim()) {',
      '@@dim',
      '} @else {',
      'class="light"',
      '}',
      '@switch (kind()) {',
      '@case (1)',
      '@case (2) {',
      'id="a"',
      '}',
      '@default {',
      'id="b"',
      '}',
      '}',
      '/>'
    ];

    it.each([
      ['line feeds and spaces', '\n  '],
      ['carriage returns, line feeds and spaces', '\r\n    '],
      ['line feeds and tabs', '\n\t'],
      ['carriage returns, line feeds and tabs', '\r\n\t\t'],
      ['tabs only', '\t'],
      ['blank lines', '\n\n \t\r\n']
    ])('tokenizes a tag whose bindings are separated by %s exactly like the same tag on a single line', (_description, separator) => {
      const tokens = describeTokens(lines.join(separator));

      expect(tokens).toEqual(describeTokens(lines.join(' ')));
      expect(tokens.flatMap(token => token.parts).filter(part => /[\t\r\n]/.test(part))).toEqual([]);
    });

    it('does not include the line breaks between the bindings in the span of their tokens', () => {
      const template = '<div\r\n\tclass="a"\r\n\t@click="f()"\r\n>\r\n</div>';
      const tokens = new Lexer(template).tokenize();

      expect(tokens.map(token => 'span' in token && template.slice(token.span.start, token.span.end))).toEqual(['<div', 'class="', 'a"', '@click="', 'f()"', '>', '</div>']);
    });

    it('keeps the line breaks declared inside an attribute value', () => {
      const tokens = new Lexer('<div\n  class="a\n  b"\n></div>').tokenize();

      expect(tokens.find(token => token.type === TokenType.ATTRIBUTE_VALUE)).toMatchObject({ parts: ['a\n  b'] });
    });

    it.each([
      ['an event name', '<div @click\n="f()"></div>', 'No spaces are allowed in event name'],
      ['an event handler name', '<div @click="f\n()"></div>', 'No spaces are allowed in event handler name'],
      ['a closing tag name', '<div></div\n>', 'Tag close name cannot contain spaces'],
      ['a directive selector and its bindings', '<div @@myDirective\n(display="block")></div>', 'there is no directive to close']
    ])('rejects a line break following %s exactly like a space', (_description, template, error) => {
      expect(() => new Lexer(template).tokenize()).toThrow(error);
      expect(() => new Lexer(template.replace('\n', ' ')).tokenize()).toThrow(error);
    });
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
