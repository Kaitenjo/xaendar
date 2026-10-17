import { describe, expect, it } from 'vitest';
import { Lexer } from '../../lexer/lexer/lexer';
import { Parser } from '../../parser/parser/parser';
import { ASTNode } from '../../parser/types/ast.type';
import type { ElementNode } from '../../parser/types/nodes/element-node.type';
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
      '  const context = new _Context({ createElement: document.createElement.bind(document), get: () => undefined });',
      '  _renderLiteralText(root, context, \'hello\', null);',
      '  return context;',
      '}'
    ].join('\n'));
  });

  describe('template variables', () => {
    it('declares the variables of the template scope in render, so that the expressions read them through the context, before their element too', async () => {
      const code = await generate('<button (click)="highlight(name)">Go</button><label>Name <input #name /></label>');

      expect(code).toContain([
        '  const context = new _Context({ createElement: document.createElement.bind(document), get: () => undefined });',
        '  context.declare(\'name\');',
        '  _renderElement(root, context, null, \'button\', [],'
      ].join('\n'));
      expect(code).toContain('handler: () => this.highlight(context.get(\'name\'))');
      expect(code).toContain('_renderElement(label1, context, null, \'input\', [], [], [], [], [], [], null, \'name\');');
    });

    it('declares the variables of a block in the function rendering it', async () => {
      const code = await generate('@if (a) { <input #field /><p>{ field.value }</p> }');

      expect(code).toContain([
        'function if0(if0, parentContext, anchor) {',
        '  const context = new _Context(parentContext);',
        '  context.declare(\'field\');'
      ].join('\n'));
      expect(code.match(/context\.declare\('field'\)/g)).toHaveLength(1);
      expect(code).toContain('() => context.get(\'field\').value');
    });

    it('declares the variables of a @for body after its iteration variables', async () => {
      const code = await generate('@for (item of items; track item()) { <input #field /> }');

      expect(code).toMatch(/const \{ item, \$index, \$first, \$last, \$even, \$odd \} = vars;\n {2}context\.declare\('field'\);/);
    });

    it('declares the variables of the content of an element a structural directive is applied to in the function rendering its children, as a scope of its own', async () => {
      const code = await generate('<div *visible><input #inner /></div><p>{ inner }</p>');

      expect(code).toContain([
        'function div0Children(div0, parentContext, anchor) {',
        '  const context = new _Context(parentContext);',
        '  context.declare(\'inner\');'
      ].join('\n'));
      // Outside of its scope the name reads the component
      expect(code).toContain('() => this.inner');
    });

    it('declares nothing in the children of an element without structural directives', async () => {
      const code = await generate('<div><input #field /></div>');

      expect(code).toContain('function div0Children(div0, parentContext, anchor) {\n  const context = new _Context(parentContext);\n  _renderElement(div0, context, null, \'input\'');
    });
  });

  describe('templates', () => {
    it('registers a template at the start of its scope, and renders its content in a scope of its own, reading the parameters as signals', async () => {
      const template = '@render row(name(), 1)<template #row(label: string, count: number)><p>{ label() } { count() }</p></template>';
      const code = await generate(template, ['name']);
      const start = template.indexOf('<template');

      expect(code).toContain([
        '  const context = new _Context({ createElement: document.createElement.bind(document), get: () => undefined });',
        `  context.addIdentifier('row', _template(context, template_row_${start}.bind(this)));`,
        '  _renderTemplate(root, context, null, context.get(\'row\'), [() => this.name(), () => 1]);',
        '  return context;'
      ].join('\n'));
      expect(code).toContain([
        `function template_row_${start}(template_row_${start}, parentContext, anchor, params) {`,
        '  const context = new _Context(parentContext);',
        '  context.createElement = _createElement;',
        '  context.addIdentifier(\'label\', params[0]);',
        '  context.addIdentifier(\'count\', params[1]);',
        `  _renderElement(template_row_${start}, context, anchor, 'p', [], [], [], [], [], [],`
      ].join('\n'));
      expect(code).toContain('_renderText(template_row_22__p0, context, () => context.get(\'label\')(), null);');
    });

    it('gives the parameters whose argument may be left out their default value, reading the parameters and the members', async () => {
      const code = await generate('<template #row(item: Item, label = item().name + suffix(), count?: number, later: number = 1)>{ label() }</template>', ['suffix']);

      expect(code).toContain([
        '  context.addIdentifier(\'item\', params[0]);',
        '  context.addIdentifier(\'label\', _parameter(params, 1, () => context.get(\'item\')().name + this.suffix()));',
        '  context.addIdentifier(\'count\', _parameter(params, 2));',
        '  context.addIdentifier(\'later\', _parameter(params, 3, () => 1));'
      ].join('\n'));
    });

    it('declares the template variables and the templates of the content of a template in its scope', async () => {
      const code = await generate('<template #row()><input #field /><template #inner() /></template>');

      expect(code).toMatch(/context\.createElement = _createElement;\n {2}context\.declare\('field'\);\n {2}context\.addIdentifier\('inner', _template\(context, template_inner_\d+\.bind\(this\)\)\);/);
    });

    it('creates the content of a template in the namespace of its declaration, and renders it there', async () => {
      const code = await generate('<svg><template #dot(x: number) /><g>@render dot(1)</g></svg>');

      expect(code).toMatch(/function template_dot_\d+\(template_dot_\d+, parentContext, anchor, params\) \{\n {2}const context = new _Context\(parentContext\);\n {2}context\.createElement = _createSVGElement;/);
      expect(code).toContain('_renderTemplate(svg0__g1, context, null, context.get(\'dot\'), [() => 1]);');
    });

    it('registers the templates of a block in the function rendering it, forwarding its anchor to the @render', async () => {
      const code = await generate('@if (a) { <template #row() />@render row() }');

      expect(code).toMatch(/function if0\(if0, parentContext, anchor\) \{\n {2}const context = new _Context\(parentContext\);\n {2}context\.addIdentifier\('row', _template\(context, template_row_\d+\.bind\(this\)\)\);/);
      expect(code).toContain('_renderTemplate(if0, context, anchor, context.get(\'row\'), []);');
    });

    it.each([
      ['a name that is not a template', '<input #field />@render field()', '[Generator] "field" is not a template visible here'],
      ['a template of another namespace', '<template #note() /><svg>@render note()</svg>', '[Generator] Template "note" is declared among HTML elements, and its content cannot be rendered among SVG elements'],
      ['a template declared twice in a scope', '<template #row() /><template #row() />', '[Generator] Identifier "row" is already declared in this scope.']
    ])('throws for the render of %s', async (_description, template, message) => {
      await expect(generate(template)).rejects.toThrow(message);
    });
  });

  it('reads the class members named like a global from the component', async () => {
    const template = '{name}';
    const code = await new Generator(template, parse(template)).generate([], ['name']);
    expect(code).toContain('() => this.name');
  });

  it('generates the helper functions for nested nodes', async () => {
    const code = await generate('<div><span></span></div>@if (a) { <b></b> }@for (i of items; track i()) { <li></li> }');

    expect(code).toContain('div0Children(div0, parentContext, anchor) {');
    expect(code).toContain('if1(if1, parentContext, anchor) {');
    expect(code).toContain('for2(for2, parentContext, items2, i2, anchor) {');
    expect(code).toContain('return { context, update };');
    expect(code).toContain('const { vars, update } = _iterationVariables(');
  });

  it('emits module-level helper functions invoked with the component bound as this', async () => {
    const code = await generate('<div><span></span></div>@if (a) { <b></b> }@for (i of items; track i()) { <li></li> }');

    expect(code).toContain('function div0Children(div0, parentContext, anchor) {');
    expect(code).toContain('(div0, parentContext) => div0Children.call(this, div0, parentContext)');
    expect(code).toContain('function if1(if1, parentContext, anchor) {');
    expect(code).toContain('block: if1.bind(this)');
    expect(code).toContain('function for2(for2, parentContext, items2, i2, anchor) {');
    expect(code).toContain('for2.bind(this));');
    expect(code).not.toMatch(/this\.(render|div0Children|if1|for2)\b/);
  });

  it('renders the content of every flow-control block before the anchor of the block', async () => {
    const code = await generate('@if (a) { <i></i> }@switch (m) { @case (1) { <b></b> } @default { <u></u>@if (n) { <s></s> } } }@for (i of items; track i()) { <li></li> }<p></p>');

    expect(code).toContain('_renderElement(if0, context, anchor, \'i\',');
    expect(code).toContain('_renderElement(case1_0, context, anchor, \'b\',');
    expect(code).toContain('_renderElement(default1, context, anchor, \'u\',');
    expect(code).toContain('_if(default1, context, anchor, [');
    expect(code).toContain('_renderElement(for2, context, anchor, \'li\',');
    expect(code).toContain('_renderElement(root, context, null, \'p\',');
  });

  it('names the branches of an @if nested directly in an @else after the outer branch', async () => {
    const code = await generate('@if (a) { <b></b> } @else { @if (c) { <i></i> } @else { <u></u> } }');

    expect(code).toContain('_if(else0, context, anchor, [');
    expect(code).toContain('block: else0__if0.bind(this)');
    expect(code).toContain('block: else0__else0.bind(this)');
    expect(code.match(/function if0\(/g)).toHaveLength(1);
    expect(code.match(/function else0\(/g)).toHaveLength(1);
    expect(code).toContain('_renderElement(else0__if0, context, anchor, \'i\',');
    expect(code).toContain('_renderElement(else0__else0, context, anchor, \'u\',');
  });

  it('names the content of the @else if and @else branches after their own branch', async () => {
    const code = await generate('<p></p>@if (a) { <b>x</b> } @else if (c) { <b>y</b> } @else { <b>z</b> }');

    expect(code).toContain('_renderElement(elseIf1_0, context, anchor, \'b\',');
    expect(code).toContain('_renderElement(else1, context, anchor, \'b\',');
    expect(code).toContain('_renderLiteralText(if1__b0, context, \'x\', null);');
    expect(code).toContain('_renderLiteralText(elseIf1_0__b0, context, \'y\', null);');
    expect(code).toContain('_renderLiteralText(else1__b0, context, \'z\', null);');
  });

  it('skips nodes that generate no code', async () => {
    const template = '@import { A } from \'./a\'\n<div><span></span></div>';
    const nodes = parse(template);
    // The parser accepts the statements only at the beginning of a template, but the generator skips them wherever they are
    const [, element] = nodes;
    (element as ElementNode).children.unshift(nodes[0]);

    expect(await new Generator(template, nodes).generate([])).not.toContain('import');
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

    await expect(new Generator('hello', ast).generate([])).rejects.toThrow('[Generator] No transition function for ASTNode of type Case');
  });
});
