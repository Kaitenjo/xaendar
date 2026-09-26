import { describe, expect, it } from 'vitest';
import { Lexer } from '../../lexer/lexer/lexer';
import { Parser } from '../../parser/parser/parser';
import { ASTNode } from '../../parser/types/ast.type';
import { ASTNodeType } from '../../parser/types/node.enum';
import { Generator } from './generator';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();
const generate = (template: string, css?: string, signals: string[] = []) => new Generator(template, parse(template)).generate(css, signals);

describe('Generator', () => {
  it('wraps the generated nodes in a _render method', async () => {
    const code = await generate('hello');
    expect(code).toBe([
      '_render() {',
      '  const root = this._root;',
      '  const context = new _Context(this, { createElement: document.createElement.bind(document), get: () => undefined });',
      '  _renderLiteralText(root, context, \'hello\', null);',
      '  return context;',
      '}'
    ].join('\n'));
  });

  it('adopts the stylesheet when a css variable is provided', async () => {
    expect(await generate('hello', 'styles')).toContain('root.adoptedStyleSheets = [styles];');
  });

  it('generates the helper functions for nested nodes', async () => {
    const code = await generate('<div><span></span></div>@if (a) { <b></b> }@for (i of items; track i) { <li></li> }');

    expect(code).toContain('div0Children(div0, parentContext, anchor) {');
    expect(code).toContain('if1(if1, parentContext, anchor) {');
    expect(code).toContain('for2(for2, parentContext, items2, i2, anchor) {');
    expect(code).toContain('return { context, update };');
    expect(code).toContain('const { vars, update } = _iterationVariables(');
  });

  it('skips nodes that generate no code', async () => {
    const code = await generate('@import { A } from \'./a\'\n<div>@import { B } from \'./b\'<span></span></div>');
    expect(code).not.toContain('import');
  });

  it('registers signals as reactive class fields', async () => {
    expect(await generate('{count}', undefined, ['count'])).toContain('_renderText(root, context, () => this.count, null);');
  });

  it('resets the pending functions between generations', async () => {
    const template = '<div><span></span></div>';
    const generator = new Generator(template, parse(template));
    const first = await generator.generate(undefined, []);
    expect(await generator.generate(undefined, [])).toBe(first);
  });

  it('forwards the compiler cache to the context', async () => {
    const template = '<my-el @(cond(), title="x")></my-el>';
    const cache = { getOrInsert: async () => ({ properties: new Map() }) as never, set: () => undefined };
    const code = await new Generator(template, parse(template), cache).generate(undefined, []);

    expect(code).toContain('unbind: _removeAttribute');
  });

  it('prefixes errors thrown while registering signals', async () => {
    await expect(generate('hello', undefined, ['a', 'a'])).rejects.toThrow('[Generator] Signal field "a" is already declared in this scope.');
  });

  it('reports nodes without a registered transition function', async () => {
    const ast = [{ type: ASTNodeType.Case, span: { start: 0, end: 5 } }] as unknown as ASTNode[];

    await expect(new Generator('hello', ast).generate(undefined, [])).rejects.toContain('[Generator] No transition function for ASTNode of type Case');
  });
});
