import { describe, expect, it } from 'vitest';
import { Lexer } from '../../lexer/lexer/lexer';
import { Parser } from '../../parser/parser/parser';
import { ASTNode } from '../../parser/types/ast.type';
import { ASTNodeType } from '../../parser/types/node.enum';
import { Generator } from './generator';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();
const generate = (template: string, signals: string[] = []) => new Generator(template, parse(template)).generate(signals);

describe('Generator', () => {
  it('wraps the generated nodes in a module-level render function', async () => {
    const code = await generate('hello');
    expect(code).toBe([
      'function render() {',
      '  const root = this._root;',
      '  const context = new _Context(this, { createElement: document.createElement.bind(document), get: () => undefined });',
      '  _renderLiteralText(root, context, \'hello\', null);',
      '  return context;',
      '}'
    ].join('\n'));
  });

  it('generates the helper functions for nested nodes', async () => {
    const code = await generate('<div><span></span></div>@if (a) { <b></b> }@for (i of items; track i) { <li></li> }');

    expect(code).toContain('div0Children(div0, parentContext, anchor) {');
    expect(code).toContain('if1(if1, parentContext, anchor) {');
    expect(code).toContain('for2(for2, parentContext, items2, i2, anchor) {');
    expect(code).toContain('return { context, update };');
    expect(code).toContain('const { vars, update } = _iterationVariables(');
  });

  it('emits module-level helper functions invoked with the component bound as this', async () => {
    const code = await generate('<div><span></span></div>@if (a) { <b></b> }@for (i of items; track i) { <li></li> }');

    expect(code).toContain('function div0Children(div0, parentContext, anchor) {');
    expect(code).toContain('(div0, parentContext) => div0Children.call(this, div0, parentContext)');
    expect(code).toContain('function if1(if1, parentContext, anchor) {');
    expect(code).toContain('block: if1.bind(this)');
    expect(code).toContain('function for2(for2, parentContext, items2, i2, anchor) {');
    expect(code).toContain('for2.bind(this));');
    expect(code).not.toMatch(/this\.(render|div0Children|if1|for2)\b/);
  });

  it('renders the content of every flow-control block before the anchor of the block', async () => {
    const code = await generate('@if (a) { <i></i> }@switch (m) { @case (1) { <b></b> } @default { <u></u>@if (n) { <s></s> } } }@for (i of items; track i) { <li></li> }<p></p>');

    expect(code).toContain('_renderElement(if0, context, anchor, \'i\',');
    expect(code).toContain('_renderElement(case1_0, context, anchor, \'b\',');
    expect(code).toContain('_renderElement(default1, context, anchor, \'u\',');
    expect(code).toContain('_if(default1, context, anchor, [');
    expect(code).toContain('_renderElement(for2, context, anchor, \'li\',');
    expect(code).toContain('_renderElement(root, context, null, \'p\',');
  });

  it('skips nodes that generate no code', async () => {
    const code = await generate('@import { A } from \'./a\'\n<div>@import { B } from \'./b\'<span></span></div>');
    expect(code).not.toContain('import');
  });

  it('registers signals as reactive class fields', async () => {
    expect(await generate('{count}', ['count'])).toContain('_renderText(root, context, () => this.count, null);');
  });

  it('resets the pending functions between generations', async () => {
    const template = '<div><span></span></div>';
    const generator = new Generator(template, parse(template));
    const first = await generator.generate([]);
    expect(await generator.generate([])).toBe(first);
  });

  it('forwards the compiler cache to the context', async () => {
    const template = '<my-el @if (cond()) { title="x" }></my-el>';
    const cache = { getOrInsert: async () => ({ properties: new Map() }) as never, set: () => undefined };
    const code = await new Generator(template, parse(template), cache).generate([]);

    expect(code).toContain('unbind: _removeAttribute');
  });

  it('prefixes errors thrown while registering signals', async () => {
    await expect(generate('hello', ['a', 'a'])).rejects.toThrow('[Generator] Signal field "a" is already declared in this scope.');
  });

  it('reports nodes without a registered transition function', async () => {
    const ast = [{ type: ASTNodeType.Case, span: { start: 0, end: 5 } }] as unknown as ASTNode[];

    await expect(new Generator('hello', ast).generate([])).rejects.toContain('[Generator] No transition function for ASTNode of type Case');
  });
});
