import { describe, expect, it } from 'vitest';
import { Lexer } from '../../lexer/lexer/lexer';
import { Parser } from '../../parser/parser/parser';
import { ASTNode } from '../../parser/types/ast.type';
import type { ElementNode } from '../../parser/types/nodes/element-node.type';
import { ASTNodeType } from '../../parser/types/node.enum';
import { Generator } from './generator';
import type { ContextCache } from '../../types/context-cache.type';
import type { SymbolImport } from '../../types/symbol-import.type';

const cache = {} as ContextCache;

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();
const generate = (template: string, signals: string[] = []) => new Generator(template, parse(template), cache).generate(signals);

describe('Generator', () => {
  it('wraps the generated nodes in a module-level render function, giving the component to the root context', async () => {
    const code = await generate('hello');
    expect(code).toBe([
      'const _layout0 = { size: 5, nodes: 5 };',
      'function render(nodeStrategy) {',
      '  const root = this._root;',
      '  const context = _scope(null, _layout0, nodeStrategy, this);',
      '  _renderLiteralText(root, context, \'hello\', null);',
      '  return context;',
      '}'
    ].join('\n'));
  });

  it('writes the constants listing the variables read first, then the constants describing the elements and the blocks, then the functions, the ones of the expressions last', async () => {
    const code = await generate('@for (item of items; track item) { <p title="{item}">{ item }</p> }');

    expect(code).toBe([
      'const _reads0 = [0];',
      'const for0Variables = { used: [\'item\'], ids: [0] };',
      'const for0$for = {',
      '  items: for0$items,',
      '  track: for0$track,',
      '  block: for0,',
      '  variables: for0Variables,',
      '  last: true,',
      '  update: _runFor,',
      '  effect: 0',
      '};',
      'const for0__p0$title$binding = {',
      '  name: \'title\',',
      '  value: for0__p0$title,',
      '  setter: _setReactiveProperty,',
      '  reads: _reads0,',
      '  update: _setExpressionProperty,',
      '  effect: 0,',
      '  target: 1',
      '};',
      'const for0__p0$element = { tagName: \'p\', attributes: [for0__p0$title$binding], children: for0__p0Children, slot: 6 };',
      'const for0__p0$text0$binding = { value: for0__p0$text0, reads: _reads0, update: _updateText, effect: 2, target: 3 };',
      'const _layout0 = { size: 9, nodes: 5, bindings: 5, sites: [for0$for], containers: 6 };',
      'const _layout1 = {',
      '  size: 11,',
      '  nodes: 6,',
      '  bindings: 7,',
      '  sites: [for0__p0$title$binding, for0__p0$text0$binding],',
      '  variables: [\'item\']',
      '};',
      'function render(nodeStrategy) {',
      '  const root = this._root;',
      '  const context = _scope(null, _layout0, nodeStrategy, this);',
      '  _for(root, context, null, for0$for);',
      '  return context;',
      '}',
      '',
      'function for0(for0, parentContext, items0, i0, anchor, nodeStrategy) {',
      '  const context = _scope(parentContext, _layout1, nodeStrategy);',
      '  _iterationVariables(context, items0, i0, for0Variables);',
      '  _renderElement(for0, context, anchor, for0__p0$element);',
      '  return context;',
      '}',
      '',
      'function for0__p0Children(for0__p0, context) {',
      '  _renderText(for0__p0, context, for0__p0$text0$binding, null, true);',
      '}',
      '',
      'function for0$items(context) {',
      '  return this.items;',
      '}',
      '',
      'function for0$track(context, item, $index, $first, $last, $even, $odd) {',
      '  return item;',
      '}',
      '',
      'function for0__p0$title(context) {',
      '  return _read(context, 0, 5);',
      '}',
      '',
      'function for0__p0$text0(context) {',
      '  return _read(context, 0, 5);',
      '}'
    ].join('\n'));
  });

  describe('element refs', () => {
    it('declares the variables of the template scope in render, so that the expressions read them through the context, before their element too', async () => {
      const code = await generate('<button (click)="highlight(name)">Go</button><label>Name <input #name /></label>');

      expect(code).toContain([
        '  const context = _scope(null, _layout0, nodeStrategy, this);',
        '  _declare(context, 5);',
        '  _renderElement(root, context, null, button0$element);'
      ].join('\n'));
      expect(code).toContain('const _layout0 = { size: 6, nodes: 6, variables: [\'name\'] };');
      expect(code).toContain('function button0$on_click(context) {\n  this.highlight(_read(context, 0, 5));\n}');
      // The root of a render tracks no node: no element gets a slot there
      expect(code).toContain('const label1__input1$element = { tagName: \'input\', ref: \'name\', refSlot: 5 };');
      expect(code).toContain('_renderElement(label1, context, null, label1__input1$element);');
    });

    it('declares the variables of a block in the function rendering it', async () => {
      const code = await generate('@if (a) { <input #field /><p>{ field.value }</p> }');

      expect(code).toContain([
        'function if0(if0, parentContext, anchor, nodeStrategy) {',
        '  const context = _scope(parentContext, _layout1, nodeStrategy);',
        '  _declare(context, 5);'
      ].join('\n'));
      // The variable, then the nodes at the top of the block, then the slots of the binding of the text
      expect(code).toContain('const _layout1 = { size: 9, nodes: 6, bindings: 8, sites: [if0__p1$text0$binding], variables: [\'field\'] };');
      expect(code).toContain('const if0__input0$element = { tagName: \'input\', ref: \'field\', refSlot: 5, slot: 6 };');
      expect(code.match(/_declare\(context, 5\)/g)).toHaveLength(1);
      expect(code).toContain('function if0__p1$text0(context) {\n  return _read(context, 0, 5).value;\n}');
    });

    it('creates the context of a @for body for the iteration variables its body reads and the variables of its scope', async () => {
      const code = await generate('@for (item of items; track item) { <input #field />@let label = item.name; { label } }');

      expect(code).toContain('function for0(for0, parentContext, items0, i0, anchor, nodeStrategy) {\n  const context = _scope(parentContext, _layout1, nodeStrategy);');
      // The item, the ref and the @let, then the input and the text, then the slots of the bindings of the @let and the text
      expect(code).toContain([
        'const _layout1 = {',
        '  size: 13,',
        '  nodes: 8,',
        '  bindings: 10,',
        '  sites: [for0$let_label$binding, for0$text2$binding],',
        '  variables: [\'item\', \'field\', \'label\']',
        '};'
      ].join('\n'));
    });

    it('declares the variables of a @for body after its iteration variables', async () => {
      const code = await generate('@for (item of items; track item) { <input #field [class.first]="{$first}" />{ item } }');

      expect(code).toContain('_iterationVariables(context, items0, i0, for0Variables);\n  _declare(context, 7);');
    });

    it('declares the variables a @for body reads once, as a constant of the module, which the configuration of _for and the body read', async () => {
      const code = await generate('@for (item of items; track item; i = $index) { { i } { item } }');

      expect(code).toContain([
        'const for0Variables = { used: [\'item\', \'$index\'], ids: [0, 1] };',
        'const for0$for = {',
        '  items: for0$items,',
        '  track: for0$track,',
        '  block: for0,',
        '  variables: for0Variables,',
        '  last: true,',
        '  update: _runFor,',
        '  effect: 0',
        '};'
      ].join('\n'));
      expect(code.match(/const for0Variables/g)).toHaveLength(1);
      expect(code).toContain('_for(root, context, null, for0$for);');
      expect(code).toMatch(/_iterationVariables\(context, items0, i0, for0Variables\);[\s\S]*return context;\n\}/);
      expect(code).toContain('function for0$track(context, item, i, $first, $last, $even, $odd) {');
      expect(code).not.toContain('$index: \'$index\'');
    });

    it('declares the variables of the content of an element a structural directive is applied to in the function rendering its children, as a scope of its own', async () => {
      const code = await generate('<div *visible><input #inner /></div><p>{ inner }</p>');

      expect(code).toContain([
        'function div0Children(div0, parentContext) {',
        '  const context = _scope(parentContext, _layout1);',
        '  _declare(context, 5);'
      ].join('\n'));
      expect(code).toContain('_renderElement(div0, context, null, div0__input0$element);\n  return context;\n}');
      // Outside of its scope the name reads the component
      expect(code).toContain('function p1$text0(context) {\n  return this.inner;\n}');
    });

    it('renders the children of an element without structural directives in the context of the element, declaring nothing', async () => {
      const code = await generate('<div><input #field /></div>');

      expect(code).toContain('function div0Children(div0, context) {\n  _renderElement(div0, context, null, div0__input0$element);\n}');
    });

    it('declares the @let and the templates of the children of an element without structural directives in the scope holding the element, creating no context for them', async () => {
      const code = await generate('<div><span>@let total = count + 1;{ total }</span><template row(item: string)><b>{ item }</b></template></div>');

      // The template takes no slot of the scope declaring it
      expect(code).toContain([
        'const _layout0 = {',
        '  size: 9,',
        '  nodes: 6,',
        '  bindings: 6,',
        '  sites: [div0__span0$let_total$binding, div0__span0$text1$binding],',
        '  variables: [\'total\']',
        '};'
      ].join('\n'));
      expect(code).toContain('function div0Children(div0, context) {');
      expect(code).toContain('function div0__span0Children(div0__span0, context) {');
      expect(code.match(/_scope\(/g)).toHaveLength(2);
    });

    it('renders the children of an element a structural directive is applied to in the context of the element when they declare nothing', async () => {
      const code = await generate('<div *visible><p>{ name }</p></div>');

      expect(code).toContain('function div0Children(div0, context) {\n  _renderElement(div0, context, null, div0__p0$element);\n}');
      expect(code).not.toContain('return context;\n}\n\nfunction div0__p0Children');
    });

    it('renders the children of an <svg>, a <math> and a <foreignObject> in the context of the element, their elements naming their namespace', async () => {
      const code = await generate('<svg><g><circle /></g><foreignObject><p /></foreignObject></svg><math><mi>x</mi></math>');

      expect(code).toContain('function svg0Children(svg0, context) {');
      expect(code).toContain('function svg0__g0Children(svg0__g0, context) {');
      expect(code).toContain('function svg0__foreignObject1Children(svg0__foreignObject1, context) {');
      expect(code).toContain('function math1Children(math1, context) {');
      expect(code).toContain('const svg0$element = { tagName: \'svg\', namespace: 1, children: svg0Children };');
      expect(code).toContain('const svg0__g0__circle0$element = { tagName: \'circle\', namespace: 1 };');
      expect(code).toContain('const svg0__foreignObject1$element = { tagName: \'foreignObject\', namespace: 1, children: svg0__foreignObject1Children };');
      expect(code).toContain('const svg0__foreignObject1__p0$element = { tagName: \'p\' };');
      expect(code).toContain('const math1__mi0$element = { tagName: \'mi\', namespace: 2, children: math1__mi0Children };');
      expect(code).not.toContain('createElement');
      // Only render creates a context
      expect(code.match(/_scope\(/g)).toHaveLength(1);
      expect(code.match(/return context;/g)).toHaveLength(1);
    });

    it('names the namespace of the elements of the blocks in an <svg>, and of the HTML ones in a <foreignObject>', async () => {
      const code = await generate('<svg>@if (a) { @for (item of items; track item) { <circle /> } }<foreignObject>@if (a) { <p /> }</foreignObject></svg>');

      expect(code).toMatch(/const svg0__if0__for0__circle0\$element = \{ tagName: 'circle', namespace: 1, slot: 5 \};/);
      expect(code).toMatch(/const svg0__foreignObject1__if0__p0\$element = \{ tagName: 'p', slot: 0 \};/);
      expect(code).not.toContain('createElement');
    });
  });

  describe('templates', () => {
    it('registers a template at the start of its scope as a constant of the module, and renders its content in a scope of its own, reading the parameters as variables', async () => {
      const template = '@render row(name(), 1)<template row(label: string, count: number)><p>{ label } { count }</p></template>';
      const code = await generate(template, ['name']);
      const start = template.indexOf('<template');

      expect(code.startsWith([
        'const _reads0 = [0];',
        'const _reads1 = [1];',
        `const template_row_${start}$template = { render: template_row_${start}, parameters: [0, 1] };`,
        `const render0$render = { template: template_row_${start}$template, args: render0$args, update: _runRender, effect: 0 };`
      ].join('\n'))).toBe(true);
      expect(code).toContain([
        '  const context = _scope(null, _layout0, nodeStrategy, this);',
        '  _renderTemplate(root, context, null, render0$render);',
        '  return context;'
      ].join('\n'));
      expect(code).toContain([
        `function template_row_${start}(template_row_${start}, parentContext, anchor, params, nodeStrategy) {`,
        '  const context = _scope(parentContext, _layout1, nodeStrategy);',
        '  context[5] = params[0];',
        '  context[6] = params[1];',
        `  _renderElement(template_row_${start}, context, anchor, template_row_${start}__p0$element);`
      ].join('\n'));
      expect(code).toContain(`_renderText(template_row_${start}__p0, context, template_row_${start}__p0$text0$binding, null, true);`);
      expect(code).toContain('function render0$args(context) {\n  return [this.name(), 1];\n}');
      expect(code).not.toContain('Parameters');
    });

    it('gives the parameters whose argument may be left out their default value, reading the parameters and the members', async () => {
      const code = await generate('<template row(item: Item, label = item.name + suffix(), count?: number, later: number = 1)>{ label }</template>', ['suffix']);

      expect(code).toContain([
        '  context[5] = params[0];',
        '  _parameter(context, params, template_row_0$label$binding);',
        '  context[7] = params[2];',
        '  _parameter(context, params, template_row_0$later$binding);'
      ].join('\n'));
      expect(code).toContain([
        'const template_row_0$label$binding = { value: template_row_0$label, variable: 6, id: 1, reads: _reads0, update: _runLet, effect: 0 };',
        'const template_row_0$later$binding = { value: template_row_0$later, variable: 8, id: 3, update: _runLet, effect: 1 };'
      ].join('\n'));
      expect(code).toContain('function template_row_0$label(context) {\n  return _read(context, 0, 5).name + this.suffix();\n}');
      expect(code).toContain('function template_row_0$later(context) {\n  return 1;\n}');
    });

    it('declares the element refs and the templates of the content of a template in its scope', async () => {
      const code = await generate('<template row()><input #field /><template inner() /></template>');

      expect(code).toMatch(/_scope\(parentContext, _layout1, nodeStrategy\);\n {2}_declare\(context, 5\);\n {2}_renderElement\(/);
      expect(code).toContain('const _layout1 = { size: 7, nodes: 6, variables: [\'field\'] };');
      expect(code).toMatch(/const template_inner_(\d+)\$template = \{ render: template_inner_\1, parameters: \[\] \};/);
    });

    it('creates the content of a template in the namespace of its declaration, and renders it there', async () => {
      const code = await generate('<svg><template dot(x: number)><circle /></template><g>@render dot(1)</g></svg><div>@render other()</div><svg><foreignObject><template other()><p /></template></foreignObject></svg>');

      expect(code).toMatch(/function template_dot_\d+\(template_dot_\d+, parentContext, anchor, params, nodeStrategy\) \{\n {2}const context = _scope\(parentContext, _layout1, nodeStrategy\);\n {2}context\[5\] = params\[0\];\n {2}_renderElement\(/);
      expect(code).toMatch(/const template_dot_\d+__circle0\$element = \{ tagName: 'circle', namespace: 1, slot: 6 \};/);
      // A template declared in a <foreignObject> creates HTML elements, wherever it is rendered
      expect(code).toMatch(/const template_other_\d+__p0\$element = \{ tagName: 'p', slot: 5 \};/);
      expect(code).not.toContain('createElement');
      expect(code).toMatch(/const svg0__g1__render0\$render = \{\n {2}template: template_dot_\d+\$template,\n {2}args: svg0__g1__render0\$args,\n {2}container: 1,\n {2}update: _runRender,\n {2}effect: 1\n\};/);
      expect(code).toContain('_renderTemplate(svg0__g1, context, null, svg0__g1__render0$render);');
    });

    it('registers the templates of a block in the function rendering it, forwarding its anchor to the @render', async () => {
      const code = await generate('@if (a) { <template row() />@render row() }<p></p>');

      expect(code).toMatch(/function if0\(if0, parentContext, anchor, nodeStrategy\) \{\n {2}const context = _scope\(parentContext, _layout1, nodeStrategy\);\n {2}_renderTemplate\(/);
      expect(code).toMatch(/const if0__render1\$render = \{ template: template_row_\d+\$template, update: _runRender, effect: 0 \};/);
      expect(code).toContain('_renderTemplate(if0, context, anchor, if0__render1$render);');
    });

    it.each([
      ['a template of another namespace', '<template note() /><svg>@render note()</svg>', '[Generator] Template "note" is declared among HTML elements, and its content cannot be rendered among SVG elements'],
      ['a template declared twice in a scope', '<template row() /><template row() />', '[Generator] Identifier "row" is already declared in this scope.']
    ])('throws for the render of %s', async (_description, template, message) => {
      await expect(generate(template)).rejects.toThrow(message);
    });
  });

  describe('@let', () => {
    it('declares the @let of a scope after its other names, and initializes it where it is written, with the variables it reads', async () => {
      const template = '<button (click)="pick(label)">Go</button><div>@let total = price() * 2;</div>@let double = total * 2;@let label = field.value;<input #field /><p>{ double }</p>';
      const code = await generate(template, ['price']);

      expect(code).toContain([
        '  _declare(context, 5);',
        '  _declare(context, 6, \'let\');',
        '  _declare(context, 7, \'let\');',
        '  _declare(context, 8, \'let\');'
      ].join('\n'));
      expect(code).toContain('function button0$on_click(context) {\n  this.pick(_read(context, 0, 8));\n}');
      expect(code).toContain('  _let(context, div1$let_total$binding);');
      expect(code).toContain('const div1$let_total$binding = { value: div1$let_total, variable: 6, id: 1, update: _runLet, effect: 2 };');
      expect(code).toContain('function div1$let_total(context) {\n  return this.price() * 2;\n}');
      expect(code).toContain('  _let(context, root$let_double$binding);\n  _let(context, root$let_label$binding);');
      expect(code).toContain([
        'const root$let_double$binding = { value: root$let_double, variable: 7, id: 2, reads: _reads0, update: _runLet, effect: 0 };',
        'const root$let_label$binding = { value: root$let_label, variable: 8, id: 3, update: _runLet, effect: 1 };'
      ].join('\n'));
      expect(code).toContain('function root$let_double(context) {\n  return _read(context, 0, 6) * 2;\n}');
      expect(code).toContain('function root$let_label(context) {\n  return _read(context, 0, 5).value;\n}');
      expect(code).toContain('_renderText(p5, context, p5$text0$binding, null, true);');
      expect(code).toContain('const p5$text0$binding = { value: p5$text0, reads: _reads1, update: _updateText, effect: 3, target: 4 };');
    });

    it('declares the @let of a block, of the content of a template and of a @for body in their own scope', async () => {
      const code = await generate('@for (item of items; track item) { @let name = item.name; }<template row()>@let id = 1;</template>');

      expect(code).toMatch(/for0Variables\);\n {2}_declare\(context, 6, 'let'\);\n {2}_let\(context, for0\$let_name\$binding\);/);
      expect(code).toContain('const for0$let_name$binding = { value: for0$let_name, variable: 6, id: 2, reads: _reads0, update: _runLet, effect: 0 };');
      expect(code).toMatch(/_scope\(parentContext, _layout1, nodeStrategy\);\n {2}_declare\(context, 5, 'let'\);\n {2}context\[5\] = 1;/);
    });

    it('throws for a @let declared twice in a scope', async () => {
      await expect(generate('@let total = 1;<p>@let total = 2;</p>')).rejects.toThrow('[Generator] Identifier "total" is already declared in this scope.');
    });
  });

  it('reads the class members named like a global from the component', async () => {
    const template = '{name}';
    const code = await new Generator(template, parse(template), cache).generate([], ['name']);
    expect(code).toContain('function root$text0(context) {\n  return this.name;\n}');
  });

  it('generates the helper functions for nested nodes', async () => {
    const code = await generate('<div><span></span></div>@if (a) { <b></b> }@for (i of items; track i) { <li></li> }');

    expect(code).toContain('div0Children(div0, context) {');
    expect(code).toContain('if1(if1, context, anchor) {');
    expect(code).toContain('for2(for2, parentContext, items2, i2, anchor, nodeStrategy) {');
    expect(code).not.toContain('_iterationVariables');
    expect(code).toContain('for2(for2, parentContext, items2, i2, anchor, nodeStrategy) {\n  const context = _scope(parentContext, _layout1, nodeStrategy);');
    // The element at the top of the body of the @for, alone in its scope
    expect(code).toContain('const _layout1 = { size: 6, nodes: 5 };');
    expect(code).toContain('const for2__li0$element = { tagName: \'li\', slot: 5 };');
    expect(code).not.toContain('for2Variables');
  });

  it('references the module-level functions rendering the blocks as they are, without binding them to the component', async () => {
    const code = await generate('<div><span></span></div>@if (a) { <b></b> }@for (i of items; track i) { <li></li> }');

    expect(code).toContain('function div0Children(div0, context) {');
    expect(code).toContain('const div0$element = { tagName: \'div\', children: div0Children };');
    expect(code).toContain('function if1(if1, context, anchor) {');
    expect(code).toContain([
      'const if1$if = {',
      '  update: _runIf,',
      '  effect: 0,',
      '  branches: [{ condition: if1$condition, block: if1, base: 7, size: 1, nodes: [0] }]',
      '};'
    ].join('\n'));
    expect(code).toContain('function for2(for2, parentContext, items2, i2, anchor, nodeStrategy) {');
    // The second block of the scope holds the second of its containers
    expect(code).toContain([
      'const for2$for = {',
      '  items: for2$items,',
      '  track: for2$track,',
      '  block: for2,',
      '  last: true,',
      '  container: 1,',
      '  update: _runFor,',
      '  effect: 1',
      '};'
    ].join('\n'));
    expect(code).toContain('const _layout0 = { size: 14, nodes: 5, bindings: 5, sites: [if1$if, for2$for], containers: 8 };');
    expect(code).not.toContain('.bind(this)');
    expect(code).not.toMatch(/this\.(render|div0Children|if1|for2)\b/);
  });

  it('renders the content of every flow-control block before the anchor of the block', async () => {
    const code = await generate('@if (a) { <i></i> }@switch (m) { @case (1) { <b></b> } @default { <u></u>@if (n) { <s></s> } } }@for (i of items; track i) { <li></li> }<p></p>');

    expect(code).toContain('_renderElement(if0, context, anchor, if0__i0$element);');
    expect(code).toContain('_renderElement(case1_0, context, anchor, case1_0__b0$element);');
    expect(code).toContain('_renderElement(default1, context, anchor, default1__u0$element);');
    expect(code).toContain('_if(default1, context, anchor, default1__if1$if);');
    expect(code).toContain('_renderElement(for2, context, anchor, for2__li0$element);');
    expect(code).toContain('_renderElement(root, context, null, p3$element);');
  });

  it('names the branches of an @if nested directly in an @else after the outer branch', async () => {
    const code = await generate('@if (a) { <b></b> } @else { @if (c) { <i></i> } @else { <u></u> } }<p></p>');

    expect(code).toContain('_if(else0, context, anchor, else0__if0$if);');
    expect(code).toContain([
      'const else0__if0$if = {',
      '  slot: 5,',
      '  update: _runIf,',
      '  effect: 0,',
      '  branches: [',
      '    { condition: else0__if0$condition, block: else0__if0, base: 7, size: 1, nodes: [0] },',
      '    { block: else0__else0, base: 7, size: 1, nodes: [0] }',
      '  ]',
      '};'
    ].join('\n'));
    expect(code.match(/function if0\(/g)).toHaveLength(1);
    expect(code.match(/function else0\(/g)).toHaveLength(1);
    expect(code).toContain('_renderElement(else0__if0, context, anchor, else0__if0__i0$element);');
    expect(code).toContain('_renderElement(else0__else0, context, anchor, else0__else0__u0$element);');
  });

  it('names the content of the @else if and @else branches after their own branch', async () => {
    const code = await generate('<p></p>@if (a) { <b>x</b> } @else if (c) { <b>y</b> } @else { <b>z</b> }<p></p>');

    expect(code).toContain('_renderElement(elseIf1_0, context, anchor, elseIf1_0__b0$element);');
    expect(code).toContain('_renderElement(else1, context, anchor, else1__b0$element);');
    expect(code).toContain('_renderLiteralText(if1__b0, context, \'x\', null);');
    expect(code).toContain('_renderLiteralText(elseIf1_0__b0, context, \'y\', null);');
    expect(code).toContain('_renderLiteralText(else1__b0, context, \'z\', null);');
  });

  describe('the last block of its parent', () => {
    it('is rendered without anchor at the root and among the children of an element, its content appended', async () => {
      const code = await generate('<td>@if (x) { <b></b> }</td>@switch (m) { @default { <i></i> } }');

      expect(code).toContain([
        'const td0__if0$if = {',
        '  last: true,',
        '  container: 1,',
        '  update: _runIf,',
        '  effect: 1,',
        '  branches: [{ condition: td0__if0$condition, block: td0__if0, base: 8, size: 1, nodes: [0] }]',
        '};'
      ].join('\n'));
      expect(code).toContain('_if(td0, context, null, td0__if0$if);');
      expect(code).toContain('_renderElement(td0__if0, context, null, td0__if0__b0$element);');
      expect(code).toContain([
        'const switch1$switch = {',
        '  expression: switch1$expression,',
        '  last: true,',
        '  update: _runIf,',
        '  effect: 0,',
        '  branches: [{ condition: null, block: default1, base: 7, size: 1, nodes: [0] }]',
        '};'
      ].join('\n'));
      expect(code).toContain('_renderElement(default1, context, null, default1__i0$element);');
    });

    it('makes the last block of the content of a last block last too, at any depth', async () => {
      const code = await generate('@if (x) { <b></b>@switch (x) { @case (1) { @for (i of items; track i) { <li></li> } } } } @else { @try { <u></u> } @catch { <s></s> } }');

      expect(code).toContain([
        'const if0$if = {',
        '  last: true,',
        '  update: _runIf,',
        '  effect: 0,',
        '  branches: [{ condition: if0$condition, block: if0 }, { block: else0 }]',
        '};'
      ].join('\n'));
      expect(code).toContain('  last: true,\n  update: _runIf,\n  effect: 0,\n  branches: [{ condition: [1], block: if0__case1_0 }]\n};');
      expect(code).toContain('_switch(if0, context, null, if0__switch1$switch);');
      expect(code).toContain('  block: if0__case1_0__for0,\n  last: true,\n  update: _runFor,\n  effect: 0\n};');
      expect(code).toContain('_for(if0__case1_0, context, null, if0__case1_0__for0$for);');
      // The body of the @for keeps its anchor
      expect(code).toContain('_renderElement(if0__case1_0__for0, context, anchor, if0__case1_0__for0__li0$element);');
      expect(code).toContain('const else0__try0$try = { content: else0__try0, catch: else0__catch0, last: true };');
      expect(code).toContain('_renderElement(else0__try0, context, null, else0__try0__u0$element);');
      expect(code).toContain('_renderElement(else0__catch0, context, null, else0__catch0__s0$element);');
    });

    it('is not last when a rendered sibling follows it, and is when only @let and <template> do', async () => {
      const code = await generate('<p>@if (x) { a } text</p><div>@if (y) { b }@let z = 1;<template t() /></div>');

      expect(code).toContain([
        'const p0__if0$if = {',
        '  update: _runIf,',
        '  effect: 0,',
        '  branches: [{ condition: p0__if0$condition, block: p0__if0, base: 8, size: 1, nodes: [0] }]',
        '};'
      ].join('\n'));
      expect(code).toContain('_renderLiteralText(p0__if0, context, \' a \', anchor, false, 0);');
      expect(code).toContain([
        'const div1__if0$if = {',
        '  last: true,',
        '  container: 1,',
        '  update: _runIf,',
        '  effect: 1,',
        '  branches: [{ condition: div1__if0$condition, block: div1__if0, base: 9, size: 1, nodes: [0] }]',
        '};'
      ].join('\n'));
      expect(code).toContain('_renderLiteralText(div1__if0, context, \' b \', null, false, 0);');
    });

    it('is never in the body of a @for, whose items move, but is in the elements of the body', async () => {
      const code = await generate('<ul>@for (row of rows; track row) { <li>@if (row) { r }</li>@if (row) { i } }</ul>');

      expect(code).toContain('  variables: ul0__for0Variables,\n  last: true,\n  update: _runFor,\n  effect: 0\n};');
      expect(code).toContain('_for(ul0, context, null, ul0__for0$for);');
      expect(code).toContain([
        '  reads: _reads0,',
        '  last: true,',
        '  container: 1,',
        '  update: _runIf,',
        '  effect: 1,',
        '  branches: [',
        '    {',
        '      condition: ul0__for0__li0__if0$condition,',
        '      block: ul0__for0__li0__if0,',
        '      base: 11,',
        '      size: 1,',
        '      nodes: [0]',
        '    }',
        '  ]',
        '};'
      ].join('\n'));
      expect(code).toContain('_if(ul0__for0__li0, context, null, ul0__for0__li0__if0$if);');
      expect(code).toContain('_renderLiteralText(ul0__for0__li0__if0, context, \' r \', null, false, 0);');
      expect(code).toContain('  reads: _reads0,\n  slot: 7,\n  update: _runIf,\n  effect: 0,\n  branches: [{ condition: ul0__for0__if1$condition, block: ul0__for0__if1, base: 10, size: 1, nodes: [0] }]\n};');
      expect(code.match(/last: true/g)).toHaveLength(2);
      expect(code).toContain('_if(ul0__for0, context, anchor, ul0__for0__if1$if);');
      expect(code).toContain('_renderLiteralText(ul0__for0__if1, context, \' i \', anchor, false, 0);');
    });

    it('is never in the content of a template, rendered where a @render is', async () => {
      const code = await generate('<template t()>@if (x) { a }</template>@render t()');

      expect(code).not.toContain('last: true');
      expect(code).toContain('_if(template_t_0, context, anchor, template_t_0__if0$if);');
      expect(code).toContain('_renderLiteralText(template_t_0__if0, context, \' a \', anchor, false, 0);');
    });
  });

  it('skips nodes that generate no code', async () => {
    const template = '@import { A } from \'./a\'\n<div><span></span></div>';
    const nodes = parse(template);
    // The parser accepts the statements only at the beginning of a template, but the generator skips them wherever they are
    const [, element] = nodes;
    (element as ElementNode).children.unshift(nodes[0]);

    expect(await new Generator(template, nodes, cache).generate([])).not.toContain('import');
  });

  it('registers signals as reactive class fields', async () => {
    const code = await generate('{count}', ['count']);

    expect(code).toContain('_renderText(root, context, root$text0$binding, null, true);');
    expect(code).toContain('function root$text0(context) {\n  return this.count;\n}');
  });

  it('passes to the runtime the texts and the @render the server separates from what precedes them, where it does', async () => {
    const code = await generate('<p>a{ x }b</p><textarea>c{ x }</textarea>@if (a) {d{ x }}<template t() />e@render t()');

    expect(code).toContain('_renderLiteralText(p0, context, \'a\', null);');
    expect(code).toContain('_renderText(p0, context, p0$text1$binding, null, true);');
    expect(code).toContain('_renderLiteralText(p0, context, \'b\', null, true);');
    expect(code).toContain('_renderLiteralText(textarea1, context, \'c\', null);');
    expect(code).toContain('_renderText(textarea1, context, textarea1$text1$binding, null);');
    expect(code).toContain('_renderLiteralText(if2, context, \'d\', anchor, false, 0);');
    expect(code).toContain('_renderText(if2, context, if2$text1$binding, anchor, true, 1);');
    expect(code).toMatch(/const render5\$render = \{ template: template_t_\d+\$template, separated: true, container: 1, update: _runRender, effect: 1 \};/);
    expect(code).toContain('_renderTemplate(root, context, null, render5$render);');
  });

  it('separates nothing in a block rendered where the parser reads the content of the element as text', async () => {
    const code = await generate('<textarea>@if (a) { { x } }</textarea>');

    expect(code).toContain('_renderText(textarea0__if0, context, textarea0__if0$text0$binding, null, false, 0);');
  });

  it('writes the expressions only as functions of the module receiving the context, and the configurations as constants, without closures nor bindings', async () => {
    const template = [
      '@for (row of rows(); track row.id) {',
      '<td (click)="select($event, row.id, kind)">',
      '@let kind = row.kind;',
      '@switch (row.kind) { @case (\'a\') { <b>a</b> } @case (\'b\') { <i>b</i> } @case (\'c\') @case (\'d\') { <u>c</u> } @default { <s>d</s> } }',
      '</td>',
      '}'
    ].join('');
    const code = await generate(template, ['rows']);

    expect(code).not.toContain('.bind(this)');
    expect(code).not.toContain('=> ');
    expect(code).toContain([
      'const for0__td0__switch1$switch = {',
      '  expression: for0__td0__switch1$expression,',
      '  reads: _reads0,',
      '  last: true,',
      '  update: _runIf,',
      '  effect: 1,',
      '  branches: [',
      '    { condition: [\'a\'], block: for0__td0__case1_0, base: 10, size: 1, nodes: [0] },',
      '    { condition: [\'b\'], block: for0__td0__case1_1, base: 10, size: 1, nodes: [0] },',
      '    { condition: [\'c\', \'d\'], block: for0__td0__case1_2, base: 10, size: 1, nodes: [0] },',
      '    { condition: null, block: for0__td0__default1, base: 10, size: 1, nodes: [0] }',
      '  ]',
      '};'
    ].join('\n'));
    expect(code.match(/const for0__td0__switch1\$switch/g)).toHaveLength(1);
    expect(code).toContain('function for0__td0Children(for0__td0, context) {\n  _let(context, for0__td0$let_kind$binding);\n  _switch(for0__td0, context, null, for0__td0__switch1$switch);\n}');
    expect(code).toContain('const for0__td0$let_kind$binding = { value: for0__td0$let_kind, variable: 6, id: 1, reads: _reads0, update: _runLet, effect: 0 };');
    expect(code).toContain('function for0__td0__switch1$expression(context) {\n  return _read(context, 0, 5).kind;\n}');
    expect(code).toContain('events: [{ name: \'click\', handler: for0__td0$on_click }],');
    expect(code).toContain('function for0__td0$on_click(context, $event) {\n  this.select($event, _read(context, 0, 5).id, _read(context, 0, 6));\n}');
    expect(code).toContain('function for0$items(context) {\n  return this.rows();\n}');
    expect(code).toContain('function for0$track(context, row, $index, $first, $last, $even, $odd) {\n  return row.id;\n}');

    // Every function of the module is declared at its top level, none inside the render code
    const functions = code.match(/function [\w$]+\(/g);
    const topLevel = code.match(/^function [\w$]+\(/gm);
    expect(functions).toEqual(topLevel);
    // The functions of the expressions follow every function rendering a block
    expect(code.lastIndexOf('function for0__td0__default1__s0Children(')).toBeLessThan(code.indexOf('function for0$items('));
  });

  it('imports before everything else only the symbols an expression reads, which the functions of the expressions read through their alias', async () => {
    const template = '{ format(1) }';
    const span = { start: 0, end: 0 };
    const symbols: SymbolImport[] = [
      { type: 'symbol', imported: 'format', local: 'format', importedSpan: span, localSpan: span, modulePath: '/src/format.ts', reactive: false },
      { type: 'symbol', imported: 'LIMIT', local: 'LIMIT', importedSpan: span, localSpan: span, modulePath: '/src/format.ts', reactive: false }
    ];
    const code = await new Generator(template, parse(template), cache).generate([], [], [], symbols);

    expect(code.startsWith('import { format as __import_format } from \'/src/format.ts\';\nconst root$text0$binding = { value: root$text0, update: _updateText, effect: 0 };\nconst _layout0 = { size: 6, nodes: 5, bindings: 5, sites: [root$text0$binding] };\nfunction render(nodeStrategy) {')).toBe(true);
    expect(code).not.toContain('LIMIT');
    expect(code).toContain('function root$text0(context) {\n  return __import_format(1);\n}');
  });

  it('resets the pending functions between generations', async () => {
    const template = '<div><span></span></div>';
    const generator = new Generator(template, parse(template), cache);
    const first = await generator.generate([]);
    expect(await generator.generate([])).toBe(first);
  });

  it('forwards the compiler cache to the context', async () => {
    const template = '<my-el @if (cond()) { title="x" }></my-el>';
    const cache = { getOrInsert: async () => ({ properties: new Map() }) as never, getImport: () => Promise.reject(new Error('No import')), set: () => undefined };
    const code = await new Generator(template, parse(template), cache).generate([]);

    expect(code).toContain('unbind: _removeAttribute');
  });

  it('prefixes errors thrown while registering signals', async () => {
    await expect(generate('hello', ['a', 'a'])).rejects.toThrow('[Generator] Signal field "a" is already declared in this scope.');
  });

  it('reports nodes without a registered transition function', async () => {
    const ast = [{ type: ASTNodeType.Case, span: { start: 0, end: 5 }, children: [] }] as unknown as ASTNode[];

    await expect(new Generator('hello', ast, cache).generate([])).rejects.toThrow('[Generator] No transition function for ASTNode of type Case');
  });
});
