import { describe, expect, it } from 'vitest';
import { Lexer } from '../../lexer/lexer/lexer';
import { Parser } from '../../parser/parser/parser';
import { ASTNode } from '../../parser/types/ast.type';
import { ASTNodeType } from '../../parser/types/node.enum';
import type { TemplateError } from '../../models/template-error/template-error.model';
import type { ImportNode } from '../../parser/types/nodes/import-node.type';
import { ComponentMetadata } from '../../types/component-metadata.type';
import type { SymbolImport } from '../../types/symbol-import.type';
import { TypeChecker } from './type-checker';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();

describe('TypeChecker', () => {
  it('wraps the generated lines in a typeCheck function and maps them to the template', async () => {
    const template = '@import { A } from \'./a\'\nhello{name}';
    const { text, mappingTable } = await new TypeChecker(template, parse(template)).generate([], ['name']);

    expect(text).toBe('function typeCheck() {\n  root.name;\n}');
    expect([...mappingTable.keys()]).toEqual([1]);
  });

  it('declares the element refs of the template at the start of the function, reading them as written in the whole template', async () => {
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
    const template = '@render row(title, 1)\n<template row(label: string, count: number)><p>{ label }</p></template>';
    const start = template.indexOf('<template');
    const { text, mappingTable } = await new TypeChecker(template, parse(template)).generate([]);

    expect(text).toBe([
      'type __Template<Params extends unknown[]> = { readonly __params: Params };',
      'type __Arguments<Params extends unknown[], Count extends number> = Params[\'length\'] extends Count ? Params : Params extends [...infer Head, unknown] ? __Arguments<Head, Count> : Params;',
      'declare function __render<Params extends unknown[], Count extends number>(template: __Template<Params>, count: Count): (...args: Count extends Params[\'length\'] ? __Arguments<Required<Params>, Count> : Params) => void;',
      'function typeCheck() {',
      `  type __Params${start} = Parameters<typeof __template${start}>;`,
      `  let row!: __Template<__Params${start}>;`,
      '  __render(row, 2)(root.title, 1);',
      `  const __template${start} = (label: string, count: number): void => {`,
      '    label;',
      '  };',
      '}'
    ].join('\n'));
    // The name of the template, the @render, the parameters and the content are mapped onto the template
    expect([...mappingTable.keys()]).toEqual([5, 6, 7, 8]);
  });

  it('writes no template helper for a template declaring no template', async () => {
    const template = '<p>{ name }</p>';
    expect((await new TypeChecker(template, parse(template)).generate([])).text).not.toContain('__Template');
  });

  it('declares the @let at the start of their scope, typed with the constant their value is checked in, the type of their value', async () => {
    const template = [
      '@import { count, format } from \'./store\'',
      '<button (click)="pick(label)">Go</button>',
      '@let total = price() * 2;',
      '@let doubled = total * 2;',
      '@let counted = count() + 1;',
      '@let label = format(unit);'
    ].join('\n');
    const ast = parse(template);
    const [count, format] = (ast[0] as ImportNode).specifiers;
    const symbols: SymbolImport[] = [
      { ...count, type: 'symbol', modulePath: '/store.ts', reactive: true },
      { ...format, type: 'symbol', modulePath: '/store.ts', reactive: false }
    ];
    const at = (text: string) => template.indexOf(text);
    const { text } = await new TypeChecker(template, ast).generate([], [], [], symbols, ['price']);

    expect(text).not.toContain('__let<');
    expect(text).toContain([
      'function typeCheck() {',
      `  let total!: typeof __let${at('@let total')};`,
      `  let doubled!: typeof __let${at('@let doubled')};`,
      `  let counted!: typeof __let${at('@let counted')};`,
      `  let label!: typeof __let${at('@let label')};`,
      '  root.pick(label);',
      `  const __let${at('@let total')} = root.price() * 2;`,
      `  const __let${at('@let doubled')} = total * 2;`,
      `  const __let${at('@let counted')} = count() + 1;`,
      `  const __let${at('@let label')} = format(root.unit);`,
      '}'
    ].join('\n'));
  });

  it('writes no template helper for @let reading no signal', async () => {
    const template = '@let label = title;';
    expect((await new TypeChecker(template, parse(template)).generate([])).text).toBe(`function typeCheck() {\n  let label!: typeof __let0;\n  const __let0 = root.title;\n}`);
  });

  it.each([
    ['read before it', '<p>{ total }</p>@let total = 1;', '"total" is read before its @let: only an event handler can read a @let declared after it'],
    ['read by its own value', '@let total = total + 1;', '"total" is read before its @let'],
    ['read by a template rendered before it', '@render row()<template row()>{ total }</template>@let total = 1;', '"total" is read by the template rendered by @render row before its @let: render the template after the @let, or read it from an event handler'],
    ['read by the track expression of a @for', '@for (item of items; track total) { @let total = 1; }', 'The track expression of a @for cannot read the @let "total": it only reads the item of the @for and its implicit variables']
  ])('fails on a @let %s', async (_description, template, message) => {
    await expect(new TypeChecker(template, parse(template)).generate([])).rejects.toThrow(message);
  });

  it('fails on an element ref read before its element is created', async () => {
    const template = '<p>{ field.value }</p><input #field />';

    await expect(new TypeChecker(template, parse(template)).generate([])).rejects.toThrow('[TypeChecker]');
    await expect(new TypeChecker(template, parse(template)).generate([])).rejects.toThrow('"field" is read before the element it names is created');
  });

  it('fails on a block of the rendering on the server in a project that does not render there', async () => {
    const template = '@client { <p></p> }';

    await expect(new TypeChecker(template, parse(template)).generate([], [], [], [], [], false)).rejects.toThrow('[TypeChecker] @client is only for a project rendering on the server');
  });

  it.each([
    ['renders on the server', true],
    ['may render on the server', undefined]
  ])('accepts the blocks of the rendering on the server in a project that %s', async (_description, ssr) => {
    const template = '@hydrate (idle) { <p></p> } @client { <p></p> }';

    await expect(new TypeChecker(template, parse(template)).generate([], [], [], [], [], ssr)).resolves.toBeDefined();
  });

  it('collects the blocks of the rendering on the server, still checking their content, while the errors are being collected', async () => {
    const template = '@client { <x-unknown></x-unknown> }';
    const { errors } = await new TypeChecker(template, parse(template)).generateTolerant([], [], [], [], [], false);

    expect(errors.map(error => (error as TemplateError).detail)).toEqual([
      '@client is only for a project rendering on the server: declare "ssr" in its xaendar.json, or remove the block',
      'x-unknown selector is not associated to any WebComponent imported in the template, nor declared in customElements'
    ]);
  });

  it('collects every element ref read before its element, still writing the shim, while the errors are being collected', async () => {
    const template = '<p title="{ field.title }">{ field.value }</p><input #field />';
    const { errors, text } = await new TypeChecker(template, parse(template)).generateTolerant([]);

    expect(errors.map(error => (error as TemplateError).detail)).toEqual([
      '"field" is read before the element it names is created: only an event handler can read an element ref declared after it',
      '"field" is read before the element it names is created: only an event handler can read an element ref declared after it'
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
