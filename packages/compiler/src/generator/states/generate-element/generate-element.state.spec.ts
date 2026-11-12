import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import { ElementNode } from '../../../parser/types/nodes/element-node.type';
import type { ContextCache } from '../../../types/context-cache.type';
import { ComponentPropertyMetadata } from '../../../type-checker/models/component-property-metadata/component-property-metadata.model';
import { GeneratorContext } from '../../context/context';
import { generateElement } from './generate-element.state';

const cache = {} as ContextCache;

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as ElementNode;

const cacheWith = (properties: Record<string, ComponentPropertyMetadata>): ContextCache => ({
  getOrInsert: async () => ({ properties: new Map(Object.entries(properties)) }) as never,
  getImport: () => Promise.reject(new Error('No import')),
  set: () => undefined
});

/**
 * Generates an element, returning the code written where it is rendered, the functions it queues, and the constants and
 * the functions it declares in the module.
 */
const run = async (template: string, context = new GeneratorContext(cache), anchor: string | null = null) => {
  const { code, functionsToProcess } = await generateElement(parse(template), 'root', '0', context, anchor);
  return { code, functionsToProcess, constants: context.constantDeclarations, functions: context.functionDeclarations, reads: context.readsDeclarations };
};

/**
 * Asserts the generated module, the constants and the functions it declares followed by the code rendering the element,
 * is valid JavaScript.
 */
const expectValidJavascript = ({ code, constants, functions, reads }: Awaited<ReturnType<typeof run>>) => {
  expect(() => new Function(reads.concat(constants, functions, code).join('\n'))).not.toThrow();
};

describe('generateElement', () => {
  it('generates a bare element as a constant of the module holding only its tag, without a function rendering its children', async () => {
    const { code, constants, functions, functionsToProcess } = await run('<div></div>');

    expect(code).toEqual(['_renderElement(root, context, null, div0$element);']);
    expect(constants).toEqual(['const div0$element = { tagName: \'div\' };']);
    expect(functions).toEqual([]);
    expect(functionsToProcess?.size).toBe(0);
  });

  it('forwards the anchor', async () => {
    const { code } = await run('<div></div>', new GeneratorContext(cache), 'anchor');
    expect(code).toEqual(['_renderElement(root, context, anchor, div0$element);']);
  });

  it('generates literal attributes, written once, the ones of an expression reading no name, evaluated once, and the bindings of any other expression, as functions of the module', async () => {
    const result = await run('<div class="a" width="{1 + 2}" title="{heading}"></div>');

    expect(result.constants).toEqual([[
      'const div0$element = {',
      '  tagName: \'div\',',
      '  attributes: [',
      '    { name: \'class\', value: \'a\', setter: _setProperty },',
      '    { name: \'width\', value: div0$width, setter: _setExpressionProperty },',
      '    { name: \'title\', value: div0$title, setter: _setReactiveProperty }',
      '  ]',
      '};'
    ].join('\n')]);
    expect(result.functions).toEqual([
      'function div0$width(context) {\n  return 1 + 2;\n}',
      'function div0$title(context) {\n  return this.heading;\n}'
    ]);
    expectValidJavascript(result);
  });

  it('passes to the binding of an attribute the constant listing the variables of the template it reads', async () => {
    const context = new GeneratorContext(cache);
    context.addIdentifier('row', 'variable');
    context.addIdentifier('field', 'value');
    const result = await run('<div title="{row.name + field.value}" class="{field.value}"></div>', context);

    expect(result.constants[0]).toContain([
      '    { name: \'title\', value: div0$title, setter: _setReactiveProperty, reads: _reads0 },',
      '    { name: \'class\', value: div0$class, setter: _setReactiveProperty }'
    ].join('\n'));
    expect(result.functions).toEqual([
      'function div0$title(context) {\n  return _read(context, 0, 7).name + _read(context, 0, 8).value;\n}',
      'function div0$class(context) {\n  return _read(context, 0, 8).value;\n}'
    ]);
    expect(result.reads).toEqual(['const _reads0 = [0];']);
    expectValidJavascript(result);
  });

  describe('component inputs', () => {
    const cache = cacheWith({
      'user-id': new ComponentPropertyMetadata('userId', 'string', { alias: 'user-id' }),
      title: new ComponentPropertyMetadata('title', 'string'),
      count: new ComponentPropertyMetadata('count', 'number'),
      tone: new ComponentPropertyMetadata('color', 'string', { alias: 'tone', exposed: true })
    });

    it('sets the inputs of a component by the name of their property, the one they are exposed with for the inputs of a host directive, through the setters of the inputs', async () => {
      const context = new GeneratorContext(cache);
      context.addSignalClassField('count');
      const result = await run('<my-el user-id="u" title="{\'heading\'}" count="{count()}" tone="dark" id="main"></my-el>', context);

      expect(result.code).toEqual(['_renderElement(root, context, null, my_el0$element);']);
      expect(result.constants).toEqual([[
        'const my_el0$element = {',
        '  tagName: \'my-el\',',
        '  attributes: [',
        '    { name: \'userId\', value: \'u\', setter: _setInput },',
        '    { name: \'title\', value: my_el0$title, setter: _setExpressionInput },',
        '    { name: \'count\', value: my_el0$count, setter: _setReactiveInput },',
        '    { name: \'tone\', value: \'dark\', setter: _setInput },',
        '    { name: \'id\', value: \'main\', setter: _setProperty }',
        '  ]',
        '};'
      ].join('\n')]);
      expect(result.functions).toEqual([
        'function my_el0$title(context) {\n  return \'heading\';\n}',
        'function my_el0$count(context) {\n  return this.count();\n}'
      ]);
      expectValidJavascript(result);
    });

    it('resets an input bound by a conditional binding by the name of its property', async () => {
      const { constants } = await run('<my-el @if (cond()) { user-id="u" }></my-el>', new GeneratorContext(cache));

      expect(constants[0]).toContain('attributes: [{ name: \'userId\', value: \'u\', setter: _setInput, unbind: _resetProperty }]');
    });

    it('does not query the metadata of a component binding no attribute', async () => {
      const context = new GeneratorContext({ getOrInsert: async () => { throw new Error('No metadata'); }, getImport: () => Promise.reject(new Error('No import')), set: () => undefined });
      const { constants } = await run('<my-el></my-el>', context);

      expect(constants).toEqual(['const my_el0$element = { tagName: \'my-el\' };']);
    });
  });

  it('wraps an object literal attribute value in parentheses', async () => {
    const result = await run('<div title="{{ a: b }}"></div>');

    expect(result.functions).toEqual(['function div0$title(context) {\n  return ({ a: this.b });\n}']);
    expectValidJavascript(result);
  });

  it('generates the handlers of the events as functions of the module named after the element and the event, receiving the context and the event when they read it', async () => {
    const result = await run('<div (click)="f($event, a, $event)" (focus)="g()"></div>');

    expect(result.constants).toEqual([[
      'const div0$element = {',
      '  tagName: \'div\',',
      '  events: [{ name: \'click\', handler: div0$on_click }, { name: \'focus\', handler: div0$on_focus }]',
      '};'
    ].join('\n')]);
    expect(result.functions).toEqual([
      'function div0$on_click(context, $event) {\n  this.f($event, this.a, $event);\n}',
      'function div0$on_focus(context) {\n  this.g();\n}'
    ]);
    expectValidJavascript(result);
  });

  it('declares $event when an argument reads a property of it, or passes it to a call', async () => {
    const result = await run('<div (input)="f($event.target.value)" (keydown)="g(format($event.key, a()))"></div>');

    expect(result.functions).toEqual([
      'function div0$on_input(context, $event) {\n  this.f($event.target.value);\n}',
      'function div0$on_keydown(context, $event) {\n  this.g(this.format($event.key, this.a()));\n}'
    ]);
    expectValidJavascript(result);
  });

  it('calls a method of a member on that member', async () => {
    const context = new GeneratorContext(cache);
    context.addSignalClassField('count');
    const result = await run('<div (click)="helper.run($event)" (focus)="count.set(1)" (blur)="helper?.stop()"></div>', context);

    expect(result.functions).toEqual([
      'function div0$on_click(context, $event) {\n  this.helper.run($event);\n}',
      'function div0$on_focus(context) {\n  this.count.set(1);\n}',
      'function div0$on_blur(context) {\n  this.helper?.stop();\n}'
    ]);
    expectValidJavascript(result);
  });

  it('calls on the component a method named like a reserved word', async () => {
    const result = await run('<div (click)="delete()" (focus)="void($event)" (blur)="new.run(a)"></div>');

    expect(result.functions).toEqual([
      'function div0$on_click(context) {\n  this.delete();\n}',
      'function div0$on_focus(context, $event) {\n  this.void($event);\n}',
      'function div0$on_blur(context) {\n  this.new.run(this.a);\n}'
    ]);
    expectValidJavascript(result);
  });

  it('appends a number to the name of the handler of an event listened to twice', async () => {
    const { constants, functions } = await run('<div (click)="f()" (click)="g()"></div>');

    expect(constants[0]).toContain('events: [{ name: \'click\', handler: div0$on_click }, { name: \'click\', handler: div0$on_click1 }]');
    expect(functions).toEqual(['function div0$on_click(context) {\n  this.f();\n}', 'function div0$on_click1(context) {\n  this.g();\n}']);
  });

  it('rejects a handler starting with a reserved word that is not a valid expression', async () => {
    await expect(run('<div (click)="delete[a=1]()"></div>')).rejects.toThrow('is not allowed inside template expressions');
  });

  it('does not leak $event into the context after generating events', async () => {
    const context = new GeneratorContext(cache);
    await run('<div (click)="f($event)"></div>', context);

    expect(context.hasUnresolvableIdentifier('$event')).toBe(false);
    expect(() => context.addUnresolvableIdentifier('$event')).not.toThrow();
  });

  it('names the function rendering the children in the constant of the element, and queues it', async () => {
    const { code, constants, functionsToProcess } = await run('<div><span></span></div>');

    expect(code).toEqual(['_renderElement(root, context, null, div0$element);']);
    expect(constants).toEqual(['const div0$element = { tagName: \'div\', children: div0Children };']);
    expect(functionsToProcess?.get('div0Children')).toMatchObject({
      fn: { parentNode: 'div0' },
      args: ['div0', 'parentContext']
    });
  });

  it('declares the element ref naming the element after its children, rendering them in the scope of the element', async () => {
    const context = new GeneratorContext(cache);
    context.addIdentifier('panel');
    const { constants, functionsToProcess } = await run('<div #panel><span></span></div>', context);

    expect(constants).toEqual(['const div0$element = { tagName: \'div\', children: div0Children, ref: \'panel\', refSlot: 7 };']);
    expect(functionsToProcess?.get('div0Children')?.fn.context).toBe(context);
  });

  it('declares the element ref naming an element without children', async () => {
    const context = new GeneratorContext(cache);
    context.addIdentifier('field');
    // At the top of the block of a scope tracking its nodes, the element gets a slot after the variables
    context.tracksNodes = true;
    const { constants } = await run('<input #field />', context);
    expect(constants).toEqual(['const input0$element = { tagName: \'input\', ref: \'field\', refSlot: 7, slot: 8 };']);
  });

  it('renders an element structural directives are applied to in a scope of its own, reading the variables one scope up, its anchor taking the slot', async () => {
    const context = new GeneratorContext(cache);
    context.addIdentifier('row', 'variable');
    context.tracksNodes = true;
    const { constants, functions, functionsToProcess } = await run('<input *guard title="{ row }" />', context);

    // The slot of its anchor, after the variable
    expect(constants[0]).toContain('slot: 8');
    expect(functions).toEqual(expect.arrayContaining(['function input0$title(context) {\n  return _read(context, 1, 7);\n}']));
    expect(functionsToProcess?.size).toBe(0);
  });

  it('renders the children of an element a structural directive is applied to in a scope of their own', async () => {
    const context = new GeneratorContext(cache);
    const { functionsToProcess } = await run('<div *visible><span></span></div>', context);
    const childrenContext = functionsToProcess?.get('div0Children')?.fn.context;
    expect(childrenContext).not.toBe(context);
    expect(childrenContext).toBeInstanceOf(GeneratorContext);
  });

  it.each([
    ['an <svg>', '<svg><g /></svg>', 'svg0Children', new GeneratorContext(cache), 'svg'],
    ['a <math>', '<math><mi /></math>', 'math0Children', new GeneratorContext(cache), 'mathml'],
    ['a <foreignObject>', '<foreignObject><div /></foreignObject>', 'foreignObject0Children', new GeneratorContext(cache, 'svg'), 'html']
  ])('renders the children of %s in a context of their namespace', async (_description, template, key, context, namespace) => {
    const { functionsToProcess } = await run(template, context);
    const childrenContext = functionsToProcess?.get(key)?.fn.context;
    expect(childrenContext).not.toBe(context);
    expect(childrenContext?.namespace).toBe(namespace);
  });

  it('renders the children of an element keeping the namespace of its scope in the same context', async () => {
    const context = new GeneratorContext(cache, 'svg');
    const { functionsToProcess } = await run('<g><circle /></g>', context);
    expect(functionsToProcess?.get('g0Children')?.fn.context).toBe(context);
  });

  it.each([
    ['svg', 1],
    ['math', 2]
  ])('names the namespace %s opens in its constant, with no code changing how the elements are created', async (tag, namespace) => {
    const { code, functionsToProcess, constants } = await run(`<${tag}><b></b></${tag}>`);
    expect(code).toEqual([`_renderElement(root, context, null, ${tag}0$element);`]);
    expect(constants).toEqual([`const ${tag}0$element = { tagName: '${tag}', namespace: ${namespace}, children: ${tag}0Children };`]);
    expect(functionsToProcess?.get(`${tag}0Children`)?.fn.precode).toBeUndefined();
  });

  it('names the namespace of the elements of its scope, and none for an HTML one', async () => {
    const { constants } = await run('<circle />', new GeneratorContext(cache, 'svg'));
    const { constants: mathml } = await run('<mi />', new GeneratorContext(cache, 'mathml'));
    const { constants: html } = await run('<div />');
    expect(constants).toEqual(['const circle0$element = { tagName: \'circle\', namespace: 1 };']);
    expect(mathml).toEqual(['const mi0$element = { tagName: \'mi\', namespace: 2 };']);
    expect(html).toEqual(['const div0$element = { tagName: \'div\' };']);
  });

  it('creates the children of a foreignObject as HTML elements, keeping the foreignObject in the namespace of its parent', async () => {
    const { code, functionsToProcess, constants } = await run('<foreignObject><div></div></foreignObject>', new GeneratorContext(cache, 'svg'));
    expect(code).toEqual(['_renderElement(root, context, null, foreignObject0$element);']);
    expect(constants).toEqual(['const foreignObject0$element = { tagName: \'foreignObject\', namespace: 1, children: foreignObject0Children };']);
    expect(functionsToProcess?.get('foreignObject0Children')?.fn.precode).toBeUndefined();
    expect(functionsToProcess?.get('foreignObject0Children')?.fn.context.namespace).toBe('html');
  });

  it('generates the classes toggled on the element before its attributes, with a setter toggling them, so that writing class finds them', async () => {
    const context = new GeneratorContext(cache);
    context.addSignalClassField('active');
    const result = await run('<div [class.is-on]="{active()}" title="x" [class.big]="{2 > 1}"></div>', context);

    expect(result.constants).toEqual([[
      'const div0$element = {',
      '  tagName: \'div\',',
      '  attributes: [',
      '    { name: \'is-on\', value: div0$class_is_on, setter: _setReactiveClass },',
      '    { name: \'big\', value: div0$class_big, setter: _setExpressionClass },',
      '    { name: \'title\', value: \'x\', setter: _setProperty }',
      '  ]',
      '};'
    ].join('\n')]);
    expect(result.functions).toEqual([
      'function div0$class_is_on(context) {\n  return this.active();\n}',
      'function div0$class_big(context) {\n  return 2 > 1;\n}'
    ]);
    expectValidJavascript(result);
  });

  it('passes to the binding of a class the constant listing the variables of the template it reads', async () => {
    const context = new GeneratorContext(cache);
    context.addIdentifier('row', 'variable');
    const { constants, reads } = await run('<div [class.on]="{row.active}"></div>', context);

    expect(constants[0]).toContain('{ name: \'on\', value: div0$class_on, setter: _setReactiveClass, reads: _reads0 }');
    expect(reads).toEqual(['const _reads0 = [0];']);
  });

  describe('conditional bindings', () => {
    it('generates the classes toggled by a branch, removed when it is no longer selected, even when the branch toggles nothing else', async () => {
      const result = await run('<div @if (cond()) { [class.on]="{1}" }></div>');

      expect(result.constants).toEqual([[
        'const div0$element = {',
        '  tagName: \'div\',',
        '  conditionalBindings: [',
        '    {',
        '      branches: [',
        '        {',
        '          condition: div0$if,',
        '          attributes: [{ name: \'on\', value: div0$class_on, setter: _setExpressionClass, unbind: _removeClass }]',
        '        }',
        '      ]',
        '    }',
        '  ]',
        '};'
      ].join('\n')]);
      expect(result.functions).toEqual([
        'function div0$if(context) {\n  return this.cond();\n}',
        'function div0$class_on(context) {\n  return 1;\n}'
      ]);
      expectValidJavascript(result);
    });

    it('skips the conditional bindings whose branches declare no binding', async () => {
      const { constants, functions } = await run('<div @if (cond()) { } @else { } @switch (mode()) { @case (1) { } } @switch (mode()) { }></div>');

      expect(constants).toEqual(['const div0$element = { tagName: \'div\' };']);
      expect(functions).toEqual([]);
    });

    it('keeps the branches declaring no binding of a conditional binding declaring some, leaving their lists out', async () => {
      const result = await run('<div @if (cond()) { } @else { title="x" }></div>');

      expect(result.constants).toEqual([[
        'const div0$element = {',
        '  tagName: \'div\',',
        '  conditionalBindings: [',
        '    {',
        '      branches: [',
        '        { condition: div0$if },',
        '        { attributes: [{ name: \'title\', value: \'x\', setter: _setProperty, unbind: _removeAttribute }] }',
        '      ]',
        '    }',
        '  ]',
        '};'
      ].join('\n')]);
      expectValidJavascript(result);
    });

    it('generates attributes, events and nested bindings, naming the conditions after the element', async () => {
      const result = await run('<div @if (cond()) { title="x" (click)="f()" @if (inner()) { id="y" } }></div>');

      expect(result.constants).toEqual([[
        'const div0$element = {',
        '  tagName: \'div\',',
        '  conditionalBindings: [',
        '    {',
        '      branches: [',
        '        {',
        '          condition: div0$if,',
        '          attributes: [{ name: \'title\', value: \'x\', setter: _setProperty, unbind: _removeAttribute }],',
        '          events: [{ name: \'click\', handler: div0$on_click }],',
        '          conditionalBindings: [',
        '            {',
        '              branches: [',
        '                {',
        '                  condition: div0$if1,',
        '                  attributes: [{ name: \'id\', value: \'y\', setter: _setProperty, unbind: _removeAttribute }]',
        '                }',
        '              ]',
        '            }',
        '          ]',
        '        }',
        '      ]',
        '    }',
        '  ]',
        '};'
      ].join('\n')]);
      expect(result.functions).toEqual([
        'function div0$if(context) {\n  return this.cond();\n}',
        'function div0$on_click(context) {\n  this.f();\n}',
        'function div0$if1(context) {\n  return this.inner();\n}'
      ]);
      expectValidJavascript(result);
    });

    it('leaves out the attribute, event and nested lists a branch does not declare', async () => {
      const result = await run('<div @if (cond()) { @if (inner()) { id="y" } }></div>');
      const [constant] = result.constants;

      expect(constant).toContain('condition: div0$if,\n          conditionalBindings: [');
      expect(constant.match(/attributes:/g)).toHaveLength(1);
      expect(constant).not.toContain('events:');
      expect(constant).not.toContain('directives:');
      expectValidJavascript(result);
    });

    it('generates the branches of an @if chain in declaration order, the @else one having no condition', async () => {
      const result = await run('<div @if (a()) { title="x" } @else if (b()) { title="y" } @else { title="z" }></div>');

      expect(result.constants).toEqual([[
        'const div0$element = {',
        '  tagName: \'div\',',
        '  conditionalBindings: [',
        '    {',
        '      branches: [',
        '        {',
        '          condition: div0$if,',
        '          attributes: [{ name: \'title\', value: \'x\', setter: _setProperty, unbind: _removeAttribute }]',
        '        },',
        '        {',
        '          condition: div0$if1,',
        '          attributes: [{ name: \'title\', value: \'y\', setter: _setProperty, unbind: _removeAttribute }]',
        '        },',
        '        { attributes: [{ name: \'title\', value: \'z\', setter: _setProperty, unbind: _removeAttribute }] }',
        '      ]',
        '    }',
        '  ]',
        '};'
      ].join('\n')]);
      expect(result.functions).toEqual([
        'function div0$if(context) {\n  return this.a();\n}',
        'function div0$if1(context) {\n  return this.b();\n}'
      ]);
      expectValidJavascript(result);
    });

    it('generates the expression of a @switch and the values of its branches, the @default one having none', async () => {
      const context = new GeneratorContext(cache);
      context.addSignalClassField('mode');
      const result = await run('<div @switch (mode()) { @case (\'a\') @case (\'b\') { title="x" } @default { id="y" } }></div>', context);

      expect(result.constants).toEqual([[
        'const div0$element = {',
        '  tagName: \'div\',',
        '  conditionalBindings: [',
        '    {',
        '      expression: div0$switch,',
        '      branches: [',
        '        {',
        '          condition: [\'a\', \'b\'],',
        '          attributes: [{ name: \'title\', value: \'x\', setter: _setProperty, unbind: _removeAttribute }]',
        '        },',
        '        {',
        '          condition: null,',
        '          attributes: [{ name: \'id\', value: \'y\', setter: _setProperty, unbind: _removeAttribute }]',
        '        }',
        '      ]',
        '    }',
        '  ]',
        '};'
      ].join('\n')]);
      expect(result.functions).toEqual(['function div0$switch(context) {\n  return this.mode();\n}']);
      expectValidJavascript(result);
    });

    it('resolves the conditions and the expressions against the current scope, passing the variables they read', async () => {
      const context = new GeneratorContext(cache);
      context.addIdentifier('item', 'variable');
      const { constants, functions, reads } = await run('<div @if (item.active) { title="x" } @switch (item.kind) { @case (1) { id="y" } }></div>', context);

      expect(constants[0].match(/reads: _reads0/g)).toHaveLength(2);
      expect(reads).toEqual(['const _reads0 = [0];']);
      // Evaluated in the scope of the branch, inside the one of the element
      expect(functions).toEqual([
        'function div0$if(context) {\n  return _read(context, 1, 7).active;\n}',
        'function div0$switch(context) {\n  return _read(context, 1, 7).kind;\n}'
      ]);
    });

    it('does not query the metadata of a native element', async () => {
      const context = new GeneratorContext({ getOrInsert: async () => { throw new Error('No metadata'); }, getImport: () => Promise.reject(new Error('No import')), set: () => undefined });
      const { constants } = await run('<div @if (cond()) { title="x" }></div>', context);

      expect(constants[0]).toContain('unbind: _removeAttribute');
    });

    it('generates a custom element of another library like a native element, without querying its metadata', async () => {
      const context = new GeneratorContext({ getOrInsert: async () => { throw new Error('No metadata'); }, getImport: () => Promise.reject(new Error('No import')), set: () => undefined });
      context.addCustomElementPatterns('sl-*');
      const { constants } = await run('<sl-button @if (cond()) { variant="primary" }></sl-button>', context);

      expect(constants[0]).toContain('unbind: _removeAttribute');
    });

    it('generates the directives applied inside a conditional binding', async () => {
      const result = await run('<div @if (cond()) { title="x" @@first @if (inner()) { @@second(display="block") } }></div>', new GeneratorContext(cacheWith({ display: new ComponentPropertyMetadata('display', 'string', { required: false }) })));

      expect(result.constants).toEqual([[
        'const div0$element = {',
        '  tagName: \'div\',',
        '  conditionalBindings: [',
        '    {',
        '      branches: [',
        '        {',
        '          condition: div0$if,',
        '          attributes: [{ name: \'title\', value: \'x\', setter: _setProperty, unbind: _removeAttribute }],',
        '          conditionalBindings: [',
        '            {',
        '              branches: [',
        '                {',
        '                  condition: div0$if1,',
        '                  directives: [{ selector: \'second\', attributes: [{ name: \'display\', value: \'block\', setter: _setInput }] }]',
        '                }',
        '              ]',
        '            }',
        '          ],',
        '          directives: [{ selector: \'first\' }]',
        '        }',
        '      ]',
        '    }',
        '  ]',
        '};'
      ].join('\n')]);
      expectValidJavascript(result);
    });

    it('uses the component metadata to describe known optional properties', async () => {
      const context = new GeneratorContext(cacheWith({ title: new ComponentPropertyMetadata('title', 'string', { required: false }) }));
      const { constants } = await run('<my-el @if (cond()) { title="x" } @else { title="y" }></my-el>', context);

      expect(constants[0].match(/unbind: _resetProperty/g)).toHaveLength(2);
      expect(constants[0]).not.toContain('defaultValue');
    });

    it('separates the descriptors of several conditional bindings', async () => {
      const result = await run('<div @if (first()) { title="x" } @if (second()) { id="y" } @switch (mode()) { @case (1) { lang="z" } }></div>');

      expect(result.constants[0].match(/branches: \[/g)).toHaveLength(3);
      expect(result.functions.map(declaration => declaration.split('(')[0])).toEqual(['function div0$if', 'function div0$if1', 'function div0$switch']);
      expectValidJavascript(result);
    });

    it('does not add unbind information for required properties, which the branch selected next binds again', async () => {
      const context = new GeneratorContext(cache);
      context.cache = cacheWith({
        title: new ComponentPropertyMetadata('title', 'string', { required: true }),
        label: new ComponentPropertyMetadata('label', 'string', { required: false })
      });
      const result = await run('<my-el @if (cond()) { title="x" label="l" } @else { title="y" }></my-el>', context);

      expect(result.constants).toEqual([[
        'const my_el0$element = {',
        '  tagName: \'my-el\',',
        '  conditionalBindings: [',
        '    {',
        '      branches: [',
        '        {',
        '          condition: my_el0$if,',
        '          attributes: [',
        '            { name: \'title\', value: \'x\', setter: _setInput },',
        '            { name: \'label\', value: \'l\', setter: _setInput, unbind: _resetProperty }',
        '          ]',
        '        },',
        '        { attributes: [{ name: \'title\', value: \'y\', setter: _setInput }] }',
        '      ]',
        '    }',
        '  ]',
        '};'
      ].join('\n')]);
      expectValidJavascript(result);
    });
  });

  describe('directives', () => {
    it('passes a directive declared without bindings', async () => {
      const { constants } = await run('<div @@myDirective></div>');

      expect(constants).toEqual(['const div0$element = { tagName: \'div\', directives: [{ selector: \'myDirective\' }] };']);
    });

    it('generates the conditional bindings of a directive, resetting its properties to their default value', async () => {
      const selectors = new Array<string>();
      const context = new GeneratorContext(cache);
      context.addSignalClassField('mode');
      context.cache = {
        getOrInsert: async selector => {
          selectors.push(selector);
          return {
            properties: new Map([
              ['label', new ComponentPropertyMetadata('label', 'string', { required: false })],
              ['display', new ComponentPropertyMetadata('display', 'string', { required: false })],
              ['title', new ComponentPropertyMetadata('title', 'string', { required: false })]
            ])
          } as never;
        },
        getImport: () => Promise.reject(new Error('No import')),
        set: () => undefined
      };
      const result = await run('<div @@myDirective(label="x" @if (cond()) { display="{mode()}" (toggled)="onToggled()" @if (inner()) { title="z" } } @else { display="none" })></div>', context);

      expect(selectors).toEqual(['@@myDirective', '@@myDirective', '@@myDirective', '@@myDirective']);
      expect(result.constants).toEqual([[
        'const div0$element = {',
        '  tagName: \'div\',',
        '  directives: [',
        '    {',
        '      selector: \'myDirective\',',
        '      attributes: [{ name: \'label\', value: \'x\', setter: _setInput }],',
        '      conditionalBindings: [',
        '        {',
        '          branches: [',
        '            {',
        '              condition: div0$if,',
        '              attributes: [',
        '                {',
        '                  name: \'display\',',
        '                  value: div0$myDirective_display,',
        '                  setter: _setReactiveInput,',
        '                  unbind: _resetProperty',
        '                }',
        '              ],',
        '              events: [{ name: \'toggled\', handler: div0$myDirective_on_toggled }],',
        '              conditionalBindings: [',
        '                {',
        '                  branches: [',
        '                    {',
        '                      condition: div0$if1,',
        '                      attributes: [{ name: \'title\', value: \'z\', setter: _setInput, unbind: _resetProperty }]',
        '                    }',
        '                  ]',
        '                }',
        '              ]',
        '            },',
        '            { attributes: [{ name: \'display\', value: \'none\', setter: _setInput, unbind: _resetProperty }] }',
        '          ]',
        '        }',
        '      ]',
        '    }',
        '  ]',
        '};'
      ].join('\n')]);
      expect(result.functions).toEqual([
        'function div0$if(context) {\n  return this.cond();\n}',
        'function div0$myDirective_display(context) {\n  return this.mode();\n}',
        'function div0$myDirective_on_toggled(context) {\n  this.onToggled();\n}',
        'function div0$if1(context) {\n  return this.inner();\n}'
      ]);
      expectValidJavascript(result);
    });

    it('generates the expression and the branches of a @switch declared in a directive', async () => {
      const context = new GeneratorContext(cacheWith({ display: new ComponentPropertyMetadata('display', 'string', { required: false }) }));
      const result = await run('<div @@myDirective(@switch (mode()) { @case (1) { display="block" } @default { (toggled)="onToggled()" } })></div>', context);
      const [constant] = result.constants;

      expect(constant).toContain('expression: div0$switch,');
      expect(constant).toContain('condition: [1],');
      expect(constant).toContain('{ condition: null, events: [{ name: \'toggled\', handler: div0$myDirective_on_toggled }] }');
      expect(constant.match(/directives:/g)).toHaveLength(1);
      expect(result.functions).toEqual([
        'function div0$myDirective_on_toggled(context) {\n  this.onToggled();\n}',
        'function div0$switch(context) {\n  return this.mode();\n}'
      ]);
      expectValidJavascript(result);
    });

    it('throws when the metadata of a directive property is not available', async () => {
      await expect(run('<div @@myDirective(display="block")></div>', new GeneratorContext({ getOrInsert: async () => undefined } as unknown as ContextCache))).rejects.toThrow('Unable to resolve the metadata of property "display" of @@myDirective');
    });

    it('throws when the metadata of a directive property bound inside a conditional binding is not available', async () => {
      await expect(run('<div @@myDirective(@if (cond()) { display="block" })></div>', new GeneratorContext({ getOrInsert: async () => undefined } as unknown as ContextCache))).rejects.toThrow('Unable to resolve the metadata of property "display" of @@myDirective');
    });

    it('throws when the directive metadata does not declare a property bound inside a conditional binding', async () => {
      const context = new GeneratorContext(cacheWith({ display: new ComponentPropertyMetadata('display', 'string') }));

      await expect(run('<div @@myDirective(@if (cond()) { other="x" })></div>', context)).rejects.toThrow('Unable to resolve the metadata of property "other" of @@myDirective');
    });

    it('generates the properties and events of a directive, without unbind information, naming their functions after the element and the selector', async () => {
      const context = new GeneratorContext(cache);
      context.addSignalClassField('mode');
      context.cache = cacheWith({ display: new ComponentPropertyMetadata('display', 'string', { required: false }), mode: new ComponentPropertyMetadata('mode', 'string', { required: false }) });
      const result = await run('<my-el @@my-directive(display="block" mode="{mode}" (toggled)="onToggled($event)")></my-el>', context);

      expect(result.constants).toEqual([[
        'const my_el0$element = {',
        '  tagName: \'my-el\',',
        '  directives: [',
        '    {',
        '      selector: \'my-directive\',',
        '      attributes: [',
        '        { name: \'display\', value: \'block\', setter: _setInput },',
        '        { name: \'mode\', value: my_el0$my_directive_mode, setter: _setReactiveInput }',
        '      ],',
        '      events: [{ name: \'toggled\', handler: my_el0$my_directive_on_toggled }]',
        '    }',
        '  ]',
        '};'
      ].join('\n')]);
      expect(result.functions).toEqual([
        'function my_el0$my_directive_mode(context) {\n  return this.mode;\n}',
        'function my_el0$my_directive_on_toggled(context, $event) {\n  this.onToggled($event);\n}'
      ]);
      expectValidJavascript(result);
    });

    it('passes the directives after the conditional bindings', async () => {
      const result = await run('<div class="a" @if (cond()) { title="x" } @@first @@second(display="block")></div>', new GeneratorContext(cacheWith({ display: new ComponentPropertyMetadata('display', 'string', { required: false }) })));
      const [constant] = result.constants;

      expect(constant.indexOf('condition: div0$if')).toBeLessThan(constant.indexOf('selector: \'first\''));
      expect(constant.indexOf('selector: \'first\'')).toBeLessThan(constant.indexOf('selector: \'second\''));
      expectValidJavascript(result);
    });

    it('leaves out the conditional bindings of an element declaring none, before its directives', async () => {
      const result = await run('<div @@myDirective(display="block")></div>', new GeneratorContext(cacheWith({ display: new ComponentPropertyMetadata('display', 'string', { required: false }) })));

      expect(result.constants).toEqual(['const div0$element = {\n  tagName: \'div\',\n  directives: [{ selector: \'myDirective\', attributes: [{ name: \'display\', value: \'block\', setter: _setInput }] }]\n};']);
      expectValidJavascript(result);
    });

    it('sets the inputs of a directive by the name of their property, never by their alias', async () => {
      const result = await run('<div @@myDirective(@if (cond()) { hint="x" } @else { hint="y" })></div>', new GeneratorContext(cacheWith({ hint: new ComponentPropertyMetadata('text', 'string', { alias: 'hint' }) })));
      const [constant] = result.constants;

      expect(constant.match(/name: 'text',/g)).toHaveLength(2);
      expect(constant).not.toContain('hint');
      expectValidJavascript(result);
    });
  });

  describe('structural directives', () => {
    it('passes the structural directives, leaving out the structural conditional bindings', async () => {
      const result = await run('<div *first *second(role="admin" level="{count()}")></div>', new GeneratorContext(cacheWith({ role: new ComponentPropertyMetadata('role', 'string', { required: false }), level: new ComponentPropertyMetadata('level', 'string', { required: false }) })));

      expect(result.constants).toEqual([[
        'const div0$element = {',
        '  tagName: \'div\',',
        '  structuralDirectives: [',
        '    { selector: \'first\' },',
        '    {',
        '      selector: \'second\',',
        '      attributes: [',
        '        { name: \'role\', value: \'admin\', setter: _setInput },',
        '        { name: \'level\', value: div0$second_level, setter: _setReactiveInput }',
        '      ]',
        '    }',
        '  ]',
        '};'
      ].join('\n')]);
      expect(result.functions).toEqual(['function div0$second_level(context) {\n  return this.count();\n}']);
      expect(result.functionsToProcess?.size).toBe(0);
      expectValidJavascript(result);
    });

    it('declares an element applying structural directives last when it is the last node of its parent, a block without anchor', async () => {
      const context = new GeneratorContext(cache);
      const { code } = await generateElement(parse('<div *first></div>'), 'td0', '0', context, null, false, true);

      expect(code).toEqual(['_renderElement(td0, context, null, td0__div0$element);']);
      expect(context.constantDeclarations).toEqual(['const td0__div0$element = { tagName: \'div\', structuralDirectives: [{ selector: \'first\' }], last: true };']);
    });

    it('declares last an element applying structural directives only through a conditional binding', async () => {
      const context = new GeneratorContext(cache);
      await generateElement(parse('<div @if (cond()) { *first }></div>'), 'td0', '0', context, null, false, true);

      expect(context.constantDeclarations[0]).toMatch(/structuralConditionalBindings: [\s\S]*,\n {2}last: true\n\};$/);
    });

    it('ignores the position of an element applying no structural directive, which is no block', async () => {
      const context = new GeneratorContext(cache);
      await generateElement(parse('<div title="x"></div>'), 'td0', '0', context, null, false, true);

      expect(context.constantDeclarations).toEqual(['const td0__div0$element = { tagName: \'div\', attributes: [{ name: \'title\', value: \'x\', setter: _setProperty }] };']);
    });

    it('names the function rendering the children, each time the element is created, after the structural directives', async () => {
      const { constants, functionsToProcess } = await run('<div *first><span></span></div>');

      expect(constants).toEqual(['const div0$element = { tagName: \'div\', structuralDirectives: [{ selector: \'first\' }], children: div0Children };']);
      expect(functionsToProcess?.get('div0Children')).toMatchObject({
        fn: { parentNode: 'div0' },
        args: ['div0', 'parentContext']
      });
    });

    it('splits a conditional binding applying structural directives from the one binding the element', async () => {
      const result = await run('<div @if (cond()) { title="x" *first } @else { *second }></div>');

      expect(result.constants).toEqual([[
        'const div0$element = {',
        '  tagName: \'div\',',
        '  conditionalBindings: [',
        '    {',
        '      branches: [',
        '        {',
        '          condition: div0$if,',
        '          attributes: [{ name: \'title\', value: \'x\', setter: _setProperty, unbind: _removeAttribute }]',
        '        },',
        '        {}',
        '      ]',
        '    }',
        '  ],',
        '  structuralConditionalBindings: [',
        '    {',
        '      branches: [',
        '        { condition: div0$if1, structuralDirectives: [{ selector: \'first\' }] },',
        '        { structuralDirectives: [{ selector: \'second\' }] }',
        '      ]',
        '    }',
        '  ]',
        '};'
      ].join('\n')]);
      expect(result.functions).toEqual([
        'function div0$if(context) {\n  return this.cond();\n}',
        'function div0$if1(context) {\n  return this.cond();\n}'
      ]);
      expectValidJavascript(result);
    });

    it('skips the element conditional bindings applying only structural directives, even through nested conditional bindings', async () => {
      const result = await run('<div @if (cond()) { *first } @if (other()) { @if (inner()) { *second } }></div>');

      expect(result.constants).toEqual([[
        'const div0$element = {',
        '  tagName: \'div\',',
        '  structuralConditionalBindings: [',
        '    { branches: [{ condition: div0$if, structuralDirectives: [{ selector: \'first\' }] }] },',
        '    {',
        '      branches: [',
        '        {',
        '          condition: div0$if1,',
        '          conditionalBindings: [{ branches: [{ condition: div0$if2, structuralDirectives: [{ selector: \'second\' }] }] }]',
        '        }',
        '      ]',
        '    }',
        '  ]',
        '};'
      ].join('\n')]);
      expectValidJavascript(result);
    });

    it('generates the nested conditional bindings applying structural directives, skipping the ones applying none', async () => {
      const result = await run('<div @switch (mode()) { @case (1) { @if (inner()) { *first } @if (skipped()) { title="x" } } @default { } }></div>');
      const [constant] = result.constants;
      const structural = constant.slice(constant.indexOf('structuralConditionalBindings'));

      expect(constant).toContain('expression: div0$switch,');
      expect(structural).toContain('expression: div0$switch1,');
      expect(structural).toContain('conditionalBindings: [{ branches: [{ condition: div0$if1, structuralDirectives: [{ selector: \'first\' }] }] }]');
      expect(structural).toContain('{ condition: null }');
      expect(structural).not.toContain('div0$if,');
      expect(constant.indexOf('condition: div0$if,')).toBeLessThan(constant.indexOf('structuralConditionalBindings'));
      expect(result.functions).toEqual([
        'function div0$if(context) {\n  return this.skipped();\n}',
        'function div0$switch(context) {\n  return this.mode();\n}',
        'function div0$if1(context) {\n  return this.inner();\n}',
        'function div0$switch1(context) {\n  return this.mode();\n}'
      ]);
      expectValidJavascript(result);
    });

    it('names the namespace of an svg applying structural directives, which the runtime creates again in it', async () => {
      const { code, constants } = await run('<svg *first><g></g></svg>');

      expect(code).toEqual(['_renderElement(root, context, null, svg0$element);']);
      expect(constants[0]).toContain('namespace: 1');
    });
  });
});
