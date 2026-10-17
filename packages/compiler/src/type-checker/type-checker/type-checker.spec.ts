import { describe, expect, it } from 'vitest';
import { Lexer } from '../../lexer/lexer/lexer';
import { Parser } from '../../parser/parser/parser';
import { ASTNode } from '../../parser/types/ast.type';
import { ASTNodeType } from '../../parser/types/node.enum';
import type { TemplateError } from '../../models/template-error/template-error.model';
import { ComponentMetadata } from '../../types/component-metadata/component-metadata.type';
import { TypeChecker } from './type-checker';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();

describe('TypeChecker', () => {
  it('wraps the generated lines in a typeCheck function and maps them to the template', async () => {
    const template = '@import { A } from \'./a\'\nhello{name}';
    const { text, mappingTable } = await new TypeChecker(template, parse(template)).generate([], ['name']);

    expect(text).toBe('function typeCheck() {\n  root.name;\n}');
    expect([...mappingTable.keys()]).toEqual([1]);
  });

  it('declares the template variables of the template at the start of the function, reading them as written in the whole template', async () => {
    const template = '<button (click)="pick(name)">Go</button><label><input #name /></label>';
    const { text } = await new TypeChecker(template, parse(template)).generate([]);

    expect(text).toBe([
      'function typeCheck() {',
      '  let name!: (HTMLElementTagNameMap extends { \'input\': infer Type } ? Type : HTMLElement);',
      '  root.pick(name);',
      '}'
    ].join('\n'));
  });

  it('declares the templates at the start of their scope, checks their content in an arrow function and their @render as a call, with the helpers they need before the function', async () => {
    const template = '@render row(title, 1)\n<template #row(label: string, count: number)><p>{ label() }</p></template>';
    const start = template.indexOf('<template');
    const { text, mappingTable } = await new TypeChecker(template, parse(template)).generate([]);

    expect(text).toBe([
      'import type * as __module0 from \'@xaendar/core/signals\';',
      'type __Template<Params extends unknown[]> = { readonly __params: Params };',
      'type __Parameters<Values extends unknown[]> = { [Key in keyof Values]: __module0.Computed<Values[Key]> };',
      'declare function __render<Params extends unknown[]>(template: __Template<Params>): (...args: Params) => void;',
      'function typeCheck() {',
      `  type __Params${start} = [label: string, count: number];`,
      `  let row!: __Template<__Params${start}>;`,
      '  __render(row)(root.title, 1);',
      `  ((...[label, count]: __Parameters<__Params${start}>) => {`,
      '    label();',
      '  });',
      '}'
    ].join('\n'));
    // The types of the parameters, the name of the template, the @render and the content are mapped onto the template
    expect([...mappingTable.keys()]).toEqual([5, 6, 7, 8, 9]);
  });

  it('writes no template helper for a template declaring no template', async () => {
    const template = '<p>{ name }</p>';
    expect((await new TypeChecker(template, parse(template)).generate([])).text).not.toContain('__Template');
  });

  it('fails on a template variable read before its element is created', async () => {
    const template = '<p>{ field.value }</p><input #field />';

    await expect(new TypeChecker(template, parse(template)).generate([])).rejects.toThrow('[TypeChecker]');
    await expect(new TypeChecker(template, parse(template)).generate([])).rejects.toThrow('"field" is read before the element it names is created');
  });

  it('collects every template variable read before its element, still writing the shim, while the errors are being collected', async () => {
    const template = '<p title="{ field.title }">{ field.value }</p><input #field />';
    const { errors, text } = await new TypeChecker(template, parse(template)).generateTolerant([]);

    expect(errors.map(error => (error as TemplateError).detail)).toEqual([
      '"field" is read before the element it names is created: only an event handler can read a template variable declared after it',
      '"field" is read before the element it names is created: only an event handler can read a template variable declared after it'
    ]);
    expect(text).toContain('field.value;');
  });

  it('resolves custom elements against the provided metadata', async () => {
    const template = '<my-el></my-el>';
    const component = { type: 'component', selector: 'my-el', properties: new Map(), events: new Map() } as unknown as ComponentMetadata;

    expect((await new TypeChecker(template, parse(template)).generate([component])).text).toBe('function typeCheck() {\n}');
  });

  it('prefixes errors with the type checker name', async () => {
    const template = '<my-el></my-el>';
    await expect(new TypeChecker(template, parse(template)).generate([])).rejects.toBeDefined();
  });

  it('reports nodes without a registered transition function', async () => {
    const ast = [{ type: ASTNodeType.Case, span: { start: 0, end: 5 } }] as unknown as ASTNode[];

    await expect(new TypeChecker('hello', ast).generate([])).rejects.toThrow('[TypeChecker] No transition function for ASTNode of type Case');
  });

  describe('generateTolerant', () => {
    const tolerant = (template: string, metadatas: ComponentMetadata[] = []) => new TypeChecker(template, parse(template)).generateTolerant(metadatas, ['name']);

    it('generates the same shim as generate when nothing fails', async () => {
      const template = '<p>{name}</p>';
      const { errors, ...result } = await tolerant(template);

      expect(errors).toEqual([]);
      expect(result).toEqual(await new TypeChecker(template, parse(template)).generate([], ['name']));
    });

    it('collects the error of every node failing instead of stopping at the first one', async () => {
      const template = '<a-a></a-a><b-b></b-b>{name}';
      const { errors, text } = await tolerant(template);

      expect(errors.map(({ message }) => message.split('\n')[0])).toEqual([
        '[TypeChecker] a-a selector is not associated to any WebComponent imported in the template, nor declared in customElements',
        '[TypeChecker] b-b selector is not associated to any WebComponent imported in the template, nor declared in customElements'
      ]);
      expect(errors.map(error => (error as TemplateError).span)).toEqual([{ start: 0, end: 11 }, { start: 11, end: 22 }]);
      expect(text).toBe('function typeCheck() {\n  root.name;\n}');
    });

    it('checks the children of an element failing, and the content of the blocks around the failing nodes', async () => {
      const template = '<a-a><b-b></b-b>{name}</a-a>@if (name) { <c-c></c-c> }';
      const { errors, text } = await tolerant(template);

      expect(errors.map(error => (error as TemplateError).span.start)).toEqual([0, 5, 41]);
      expect(text).toContain('root.name;');
    });

    it('skips the children of a block whose own check fails', async () => {
      const template = '@if (name) { <c-c></c-c> }';
      const checker = new TypeChecker(template, parse(template));
      (checker as unknown as { _states: Record<number, unknown> })._states[ASTNodeType.If] = () => {
        throw new Error('boom');
      };

      const { errors, text } = await checker.generateTolerant([]);

      expect(errors.map(({ message }) => message)).toEqual(['[TypeChecker] boom']);
      expect(text).toBe('function typeCheck() {\n}');
    });

    it('does not collect the errors of a later generate', async () => {
      const template = '<a-a></a-a>';
      const checker = new TypeChecker(template, parse(template));
      await checker.generateTolerant([]);

      await expect(checker.generate([])).rejects.toThrow('[TypeChecker] a-a selector is not associated');
    });

    it('still throws for nodes without a registered transition function', async () => {
      const ast = [{ type: ASTNodeType.Case, span: { start: 0, end: 5 } }] as unknown as ASTNode[];

      await expect(new TypeChecker('hello', ast).generateTolerant([])).rejects.toThrow('[TypeChecker] No transition function for ASTNode of type Case');
    });
  });
});
