import { parseTemplate, TemplateError, type TypeCheckResult } from '@xaendar/compiler';
import { createSourceFile, ScriptTarget } from 'typescript';
import { describe, expect, it } from 'vitest';
import { findInnermostSpan, getEnclosingElementName, getErrorSpan, toTemplateSpan } from './template-span.utils';

describe('toTemplateSpan', () => {
  // `{ foo + bar }` type-checked, after a prefix line, as `root.foo + root.bar;`
  const shimFile = createSourceFile('shim.ts', 'prefix\nroot.foo + root.bar;', ScriptTarget.Latest);
  const typeCheck = {
    text: 'root.foo + root.bar;',
    mappingTable: new Map([[0, [
      { columnStart: 0, columnEnd: 20, original: { start: 0, end: 13 } },
      { columnStart: 5, columnEnd: 8, original: { start: 2, end: 5 } }
    ]]])
  } as TypeCheckResult;

  it('converts a position copied one to one into the exact characters of the template', () => {
    expect(toTemplateSpan(typeCheck, shimFile, 1, 7 + 6, 2)).toEqual({ start: 3, end: 5 });
    // Never beyond the end of the mapping
    expect(toTemplateSpan(typeCheck, shimFile, 1, 7 + 5, 10)).toEqual({ start: 2, end: 5 });
  });

  it('converts any other position into the span of the whole mapping', () => {
    expect(toTemplateSpan(typeCheck, shimFile, 1, 7 + 12, 1)).toEqual({ start: 0, end: 13 });
  });

  it('returns undefined for a position not mapped onto the template', () => {
    expect(toTemplateSpan(typeCheck, shimFile, 1, 0, 1)).toBeUndefined();
  });
});

describe('getErrorSpan', () => {
  const template = '<my-el label="a" [class.on]="{b}" (picked)="f()" @@tip></my-el>';
  const ast = parseTemplate(template);
  const errorOn = (text: string, length = text.length) => new TemplateError('', { start: template.indexOf(text), end: template.indexOf(text) + length }, '');
  const textOf = (span: { start: number, end: number }) => template.slice(span.start, span.end);

  it('narrows an error on a whole element, directive, attribute, class binding or event to its name', () => {
    expect(textOf(getErrorSpan(errorOn(template), ast))).toBe('my-el');
    expect(textOf(getErrorSpan(errorOn('tip'), ast))).toBe('tip');
    expect(textOf(getErrorSpan(errorOn('label="a"'), ast))).toBe('label');
    expect(textOf(getErrorSpan(errorOn('[class.on]="{b}"'), ast))).toBe('[class.on]');
    expect(textOf(getErrorSpan(errorOn('(picked)="f()"'), ast))).toBe('picked');
  });

  it('keeps the span of any other error, and of an error of a template that could not be parsed', () => {
    expect(textOf(getErrorSpan(errorOn('"a"'), ast))).toBe('"a"');
    expect(getErrorSpan(new TemplateError('', { start: 1, end: 3 }, ''), undefined)).toEqual({ start: 1, end: 3 });
  });

  it('reports an error without span at the start of the template', () => {
    expect(getErrorSpan(new Error('boom'), ast)).toEqual({ start: 0, end: 0 });
  });
});

describe('getEnclosingElementName', () => {
  it('returns the name of the innermost element containing the offset', () => {
    const template = '<ul><li>{ a }</li></ul> b';
    const ast = parseTemplate(template);

    expect(getEnclosingElementName(ast, template.indexOf('a'))).toEqual({ start: 5, end: 7 });
    expect(getEnclosingElementName(ast, template.indexOf('b'))).toBeUndefined();
  });
});

describe('findInnermostSpan', () => {
  it('returns the narrowest span containing the offset, ends included', () => {
    const outer = { span: { start: 0, end: 10 } };
    const inner = { span: { start: 2, end: 4 } };

    expect(findInnermostSpan([outer, inner], 4)).toBe(inner);
    expect(findInnermostSpan([inner, outer], 3)).toBe(inner);
    expect(findInnermostSpan([outer, inner], 6)).toBe(outer);
    expect(findInnermostSpan([outer], 11)).toBeUndefined();
  });
});
