import { describe, expect, it } from 'vitest';
import { getKeywordContext } from './keyword-context.utils';

/**
 * Returns the keyword context at the end of a template, as `keywords@start-end`.
 */
const contextOf = (template: string) => {
  const context = getKeywordContext(template, template.length);
  return context && `${context.keywords.join(',')}@${context.span.start}-${context.span.end}`;
};

/**
 * Returns the keyword context at the `|` marking the offset of a template, as `keywords@start-end`.
 */
const contextAt = (template: string) => {
  const context = getKeywordContext(template.replace('|', ''), template.indexOf('|'));
  return context && `${context.keywords.join(',')}@${context.span.start}-${context.span.end}`;
};

describe('getKeywordContext', () => {
  it.each([
    ['nothing written yet', '<p>a</p>\n@', 'if,for,switch,hydrate,client,try,defer,render,let@9-10'],
    ['a partial keyword', '<p>a</p>\n@fo', 'if,for,switch,hydrate,client,try,defer,render,let@9-12'],
    ['a block nested in another one', '@for (item of items) {\n  @', 'if,for,switch,hydrate,client,try,defer,render,let@25-26'],
    ['a block after a @for block', '@for (item of items) {\n}\n@', 'if,for,switch,hydrate,client,try,defer,render,let@25-26'],
    ['a block in a @case block', '@switch (a) {\n  @case (1) {\n    @', 'if,for,switch,hydrate,client,try,defer,render,let@32-33'],
    ['a block in a @else block', '@if (a) {\n} @else {\n  @', 'if,for,switch,hydrate,client,try,defer,render,let@22-23'],
    ['a block after a @else block', '@if (a) {\n} @else {\n}\n@', 'if,for,switch,hydrate,client,try,defer,render,let@22-23'],
    ['a block after a text', 'text\n@', 'if,for,switch,hydrate,client,try,defer,render,let@5-6']
  ])('proposes the blocks of the template content: %s', (_name, template, expected) => {
    expect(contextOf(template)).toBe(expected);
  });

  it.each([
    ['right after the block', '@if (a) {\n}\n@el', 'if,for,switch,hydrate,client,try,defer,render,let,else,else if@12-15'],
    ['on the same line', '@if (a) {\n} @', 'if,for,switch,hydrate,client,try,defer,render,let,else,else if@12-13'],
    ['after a @else if block', '@if (a) {\n} @else if (b) {\n}\n@', 'if,for,switch,hydrate,client,try,defer,render,let,else,else if@29-30']
  ])('proposes @else and @else if after a @if block: %s', (_name, template, expected) => {
    expect(contextOf(template)).toBe(expected);
  });

  it.each([
    ['nothing written yet', '@switch (a) {\n  @', 'case,default@16-17'],
    ['after a @case block', '@switch (a) {\n  @case (1) {\n  }\n  @', 'case,default@34-35'],
    ['a block nested in a @case one before the offset', '@switch (a) {\n  @case (1) {\n    @if (b) {\n    }\n  }\n  @', 'case,default@54-55']
  ])('proposes only @case and @default in a @switch block: %s', (_name, template, expected) => {
    expect(contextOf(template)).toBe(expected);
  });

  it.each([
    ['before the offset', '@switch (a) {\n  @default {\n  }\n  @|\n}', 'case@33-34'],
    ['after the offset', '@switch (a) {\n  @|\n  @default {\n  }\n}', 'case@16-17'],
    ['after the offset, the keyword being written ignored', '@switch (a) {\n  @de|\n  @default {\n  }\n}', 'case@16-19']
  ])('proposes only @case in a @switch block declaring its @default %s', (_name, template, expected) => {
    expect(contextAt(template)).toBe(expected);
  });

  it.each([
    ['in a nested @switch', '@switch (a) {\n  @case (1) {\n    @switch (b) {\n      @|\n    }\n  }\n  @default {\n  }\n}'],
    ['holding a nested @switch declaring one', '@switch (a) {\n  @|\n  @case (1) {\n    @switch (b) {\n      @default {\n      }\n    }\n  }\n}'],
    ['in a template that cannot be lexed after the offset', '@switch (a) {\n  @|\n  <b (click="x"></b>\n  @default {\n  }\n}']
  ])('proposes @default in a @switch block declaring none: %s', (_name, template) => {
    expect(contextAt(template)).toMatch(/^case,default@/);
  });

  it.each([
    ['right after the block', '@client {\n}\n@pl', 'if,for,switch,hydrate,client,try,defer,render,let,placeholder@12-15'],
    ['on the same line', '@client {\n} @', 'if,for,switch,hydrate,client,try,defer,render,let,placeholder@12-13']
  ])('proposes @placeholder after a @client block, as the one of a @client: %s', (_case, source, expected) => {
    const context = getKeywordContext(source, source.length)!;

    expect(`${context.keywords.join(',')}@${context.span.start}-${context.span.end}`).toBe(expected);
    expect(context.clientPlaceholder).toBe(true);
  });

  it.each([
    ['right after the block', '@try {\n}\n@ca', 'catch@9-12'],
    ['on the same line', '@try {\n} @', 'catch@9-10'],
    ['after a block nested in it', '@try {\n  @if (a) {\n  }\n}\n@', 'catch@25-26']
  ])('proposes only @catch after a @try block, which needs one: %s', (_name, template, expected) => {
    expect(contextOf(template)).toBe(expected);
  });

  it.each([
    ['right after the block', '@defer (idle) {\n}\n@', 'placeholder,loading,error'],
    ['after its @placeholder', '@defer (idle) {\n} @placeholder {\n}\n@', 'loading,error'],
    ['after its @error with a name and its @loading', '@defer (idle) {\n} @error (failure) {\n} @loading {\n} @', 'placeholder'],
    ['after all of them', '@defer (idle) {\n} @loading {\n} @placeholder {\n} @error {\n} @', '']
  ])('proposes the blocks following a @defer not written yet: %s', (_name, template, expected) => {
    const context = getKeywordContext(template, template.length)!;

    expect(context.keywords.slice(9).join(',')).toBe(expected);
    expect(context.clientPlaceholder).toBeUndefined();
  });

  it.each([
    ['the @placeholder of a @client', '@client {\n} @placeholder {\n} @'],
    ['a @placeholder alone', '<p></p>@placeholder {\n} @'],
    ['the start of the content of a @loading', '@defer (idle) {\n} @loading {\n  @']
  ])('proposes no block of a @defer after %s', (_name, template) => {
    expect(getKeywordContext(template, template.length)!.keywords).toEqual(['if', 'for', 'switch', 'hydrate', 'client', 'try', 'defer', 'render', 'let']);
  });

  it('proposes the blocks of the template content after a @catch block', () => {
    expect(contextOf('@try {\n} @catch (error) {\n}\n@')).toBe('if,for,switch,hydrate,client,try,defer,render,let@28-29');
  });

  it.each([
    ['nothing written yet', '@', 'if,for,switch,hydrate,client,try,defer,render,let,import@0-1'],
    ['after blank lines only', '\n\n@', 'if,for,switch,hydrate,client,try,defer,render,let,import@2-3'],
    ['after other @import statements', '@import { A } from \'./a\';\n@', 'if,for,switch,hydrate,client,try,defer,render,let,import@26-27'],
    ['after the ; of a statement on a line of its own', '@import { A } from \'./a\'\n;\n@', 'if,for,switch,hydrate,client,try,defer,render,let,import@27-28']
  ])('proposes @import before anything else: %s', (_name, template, expected) => {
    expect(contextOf(template)).toBe(expected);
  });

  it.each([
    ['the bindings of a tag', '<b @', 'if,switch@3-4'],
    ['a conditional binding after a @if one', '<b @if (a) { title="x" } @', 'if,switch,else,else if@25-26'],
    ['the bindings of a directive', '<b @@tooltip(text="a" @', 'if,switch@22-23']
  ])('proposes the conditional bindings among %s', (_name, template, expected) => {
    expect(contextOf(template)).toBe(expected);
  });

  it.each([
    ['plain text', '<p>a</p>'],
    ['the @@ of a directive', '<b @@'],
    ['an interpolation', '{ @'],
    ['a template that cannot be lexed', '<b (click="@']
  ])('finds no keyword in %s', (_name, template) => {
    expect(contextOf(template)).toBeUndefined();
  });
});
