import { GeneratorContext, parseTemplate, type ElementNode, type ContextCache } from '@xaendar/compiler';
import { describe, expect, it, vi } from 'vitest';
import type { GenerateChildren } from '../../types/generate-children.type';
import { toStatements } from '../../utils/server-code/server-code.utils';
import { generateServerElement } from './generate-server-element.state';

const cache = {} as ContextCache;

/**
 * Generates the children of an element as a placeholder naming where they are rendered.
 */
const generateChildren = vi.fn<GenerateChildren>((nodes, parent) => ({ pieces: nodes.length ? [{ html: `{children of ${parent.id}}` }] : [] }));

/**
 * Generates the code of the first element of a template, returning its lines, the functions it calls, and the
 * constants and the functions it declares in the module.
 */
const generate = (source: string, context = new GeneratorContext(cache)) => {
  context.addSignalClassField('on');
  context.addSignalClassField('mode');
  const { pieces, functionsToProcess } = generateServerElement(parseTemplate(source)[0] as ElementNode, { id: 'root' }, '0', context, generateChildren);
  return { code: toStatements(pieces), functionsToProcess, constants: context.constantDeclarations, functions: context.functionDeclarations };
};

/**
 * Writes the declaration of a function of the module returning the value of an expression.
 */
const expressionFunction = (name: string, expression: string) => `function ${name}(context) {\n  return ${expression};\n}`;

describe('generateServerElement', () => {
  it('writes a native element with static and expression attributes as HTML, escaping the values of the expressions when rendered', () => {
    const { code, functionsToProcess, constants, functions } = generate('<a href="/x?a=1&amp;b=&quot;2&quot;" title="{ on() }">t</a>');

    expect(code).toEqual(['out.push(\'<a href="/x?a=1&amp;b=&quot;2&quot;"\' + _ssrAttribute(\'title\', this.on()) + \'>{children of a0}</a>\');']);
    expect(functionsToProcess).toBeUndefined();
    expect(constants).toEqual([]);
    expect(functions).toEqual([]);
  });

  it('writes no end tag for a void element, and a line feed after the start tag of an element dropping it', () => {
    expect(generate('<input value="a" />').code).toEqual(['out.push(\'<input value="a">\');']);
    expect(generate('<pre>x</pre>').code).toEqual(['out.push(\'<pre>\\n{children of pre0}</pre>\');']);
  });

  it('writes the children of an element opening a namespace in its namespace, with an end tag whatever its name', () => {
    const { code } = generate('<svg viewBox="0 0 1 1"><path d="M0" /></svg>');

    expect(code).toEqual(['out.push(\'<svg viewBox="0 0 1 1">{children of svg0}</svg>\');']);
    expect(generateChildren.mock.lastCall![2].namespace).toBe('svg');
  });

  it('writes the static content of a standard <template> as it is, without generating its children', () => {
    generateChildren.mockClear();
    expect(generate('<template id="row"><li class="a">x</li></template>').code).toEqual(['out.push(\'<template id="row"><li class="a">x</li></template>\');']);
    expect(generate('<template id="empty"></template>').code).toEqual(['out.push(\'<template id="empty"></template>\');']);
    expect(generateChildren).not.toHaveBeenCalled();
  });

  it('writes the static content of a standard <template> its structural directives allow in the function writing it', () => {
    const { constants, functions, functionsToProcess } = generate('<template *first><b>x</b></template>');

    expect(constants).toEqual(['const template0$structural = { structuralDirectives: [{ selector: \'first\' }], render: template0$render };']);
    expect(functions).toEqual(['function template0$render(out, context) {\n  out.push(\'<template><b>x</b></template>\');\n}']);
    expect(functionsToProcess!.size).toBe(0);
  });

  it('passes to a component the templates written among its children, by their name and the functions writing them', () => {
    const context = new GeneratorContext(cache);
    context.addIdentifier('row', 'template', 'template_row_10');
    const { code, constants } = generate('<user-card><template row()></template></user-card>', context);

    expect(code).toEqual(['_ssrComponent(out, context, user_card0$element);', 'out.push(\'{children of user_card0}</user-card>\');']);
    expect(constants).toEqual(['const user_card0$element = { tagName: \'user-card\', templates: [{ name: \'row\', template: template_row_10 }] };']);
  });

  it('initializes the element ref of the element as undefined before writing it', () => {
    const context = new GeneratorContext(cache);
    context.addIdentifier('field');
    expect(generate('<input #field />', context).code).toEqual(['_set(context, 0, 5, undefined);', 'out.push(\'<input>\');']);
  });

  it('writes the start tag of a component through _ssrComponent with the constant describing it, and its light DOM and end tag after it', () => {
    const { code, constants, functions } = generate('<user-card name="x" label="{ on() }">light</user-card>');

    expect(code).toEqual(['_ssrComponent(out, context, user_card0$element);', 'out.push(\'{children of user_card0}</user-card>\');']);
    expect(constants).toEqual([[
      'const user_card0$element = {',
      '  tagName: \'user-card\',',
      '  attributes: [',
      '    { name: \'name\', value: \'x\', setter: _setProperty },',
      '    { name: \'label\', value: user_card0$label, setter: _setExpressionProperty }',
      '  ]',
      '};'
    ].join('\n')]);
    expect(functions).toEqual([expressionFunction('user_card0$label', 'this.on()')]);
  });

  it('writes a custom element of another library like a native element', () => {
    const context = new GeneratorContext(cache);
    context.addCustomElementPatterns('sl-*');

    expect(generate('<sl-button variant="primary"></sl-button>', context).code).toEqual(['out.push(\'<sl-button variant="primary"></sl-button>\');']);
  });

  it('writes the start tag of an element toggling classes through _ssrStartTag, the classes after the attributes', () => {
    const { code, constants, functions } = generate('<div class="a" [class.is-on]="{ on() }"></div>');

    expect(code).toEqual(['_ssrStartTag(out, context, div0$element);', 'out.push(\'</div>\');']);
    expect(constants).toEqual([[
      'const div0$element = {',
      '  tagName: \'div\',',
      '  attributes: [',
      '    { name: \'class\', value: \'a\', setter: _setProperty },',
      '    { name: \'is-on\', value: div0$class_is_on, setter: _setExpressionClass }',
      '  ]',
      '};'
    ].join('\n')]);
    expect(functions).toEqual([expressionFunction('div0$class_is_on', 'this.on()')]);
  });

  it('describes the conditional bindings writing attributes or classes, nested ones included, leaving out the ones writing nothing', () => {
    const { code, constants, functions } = generate([
      '<div',
      '  @if (on()) { title="x" @if (inner) { id="y" } } @else if (other) { [class.on]="{ 1 }" } @else { title="z" }',
      '  @switch (mode()) { @case (\'a\') @case (\'b\') { lang="x" } @default { lang="y" } }',
      '  @if (events) { (click)="f()" }',
      '></div>'
    ].join(' '));

    expect(code).toEqual(['_ssrStartTag(out, context, div0$element);', 'out.push(\'</div>\');']);
    expect(constants).toEqual([[
      'const div0$element = {',
      '  tagName: \'div\',',
      '  conditionalBindings: [',
      '    {',
      '      branches: [',
      '        {',
      '          condition: div0$if,',
      '          attributes: [{ name: \'title\', value: \'x\', setter: _setProperty }],',
      '          conditionalBindings: [',
      '            {',
      '              branches: [{ condition: div0$if1, attributes: [{ name: \'id\', value: \'y\', setter: _setProperty }] }]',
      '            }',
      '          ]',
      '        },',
      '        {',
      '          condition: div0$if2,',
      '          attributes: [{ name: \'on\', value: div0$class_on, setter: _setExpressionClass }]',
      '        },',
      '        { attributes: [{ name: \'title\', value: \'z\', setter: _setProperty }] }',
      '      ]',
      '    },',
      '    {',
      '      expression: div0$switch,',
      '      branches: [',
      '        { condition: [\'a\', \'b\'], attributes: [{ name: \'lang\', value: \'x\', setter: _setProperty }] },',
      '        { condition: null, attributes: [{ name: \'lang\', value: \'y\', setter: _setProperty }] }',
      '      ]',
      '    }',
      '  ]',
      '};'
    ].join('\n')]);
    expect(functions).toEqual([
      expressionFunction('div0$if', 'this.on()'),
      expressionFunction('div0$if1', 'this.inner'),
      expressionFunction('div0$if2', 'this.other'),
      expressionFunction('div0$class_on', '1'),
      expressionFunction('div0$switch', 'this.mode()')
    ]);
  });

  it('marks an element listening to submit, in the branch of a conditional binding listening to it too', () => {
    expect(generate('<form (submit)="f()"></form>').code).toEqual(['out.push(\'<form data-xd-submit=""></form>\');']);

    const { constants } = generate('<form @if (on()) { (submit)="f()" }></form>');

    expect(constants).toEqual([[
      'const form0$element = {',
      '  tagName: \'form\',',
      '  conditionalBindings: [',
      '    {',
      '      branches: [{ condition: form0$if, attributes: [{ name: \'data-xd-submit\', value: \'\', setter: _setProperty }] }]',
      '    }',
      '  ]',
      '};'
    ].join('\n')]);
  });

  it('writes the start tag of a native element applying custom directives through _ssrStartTag, with their properties and without their events', () => {
    const { code, constants, functions } = generate('<p title="t" @@tip(text="a" level="{ on() }" (shown)="f()") @@mark>x</p>');

    expect(code).toEqual(['_ssrStartTag(out, context, p0$element);', 'out.push(\'{children of p0}</p>\');']);
    expect(constants).toEqual([[
      'const p0$element = {',
      '  tagName: \'p\',',
      '  attributes: [{ name: \'title\', value: \'t\', setter: _setProperty }],',
      '  directives: [',
      '    {',
      '      selector: \'tip\',',
      '      attributes: [',
      '        { name: \'text\', value: \'a\', setter: _setProperty },',
      '        { name: \'level\', value: p0$level, setter: _setExpressionProperty }',
      '      ]',
      '    },',
      '    { selector: \'mark\' }',
      '  ]',
      '};'
    ].join('\n')]);
    expect(functions).toEqual([expressionFunction('p0$level', 'this.on()')]);
  });

  it('describes the custom directives of the conditional bindings of a native element, nested ones included', () => {
    const { code, constants } = generate('<p @if (on()) { @@tip @if (inner) { @@mark } }></p>');

    expect(code).toEqual(['_ssrStartTag(out, context, p0$element);', 'out.push(\'</p>\');']);
    expect(constants).toEqual([[
      'const p0$element = {',
      '  tagName: \'p\',',
      '  conditionalBindings: [',
      '    {',
      '      branches: [',
      '        {',
      '          condition: p0$if,',
      '          directives: [{ selector: \'tip\' }],',
      '          conditionalBindings: [{ branches: [{ condition: p0$if1, directives: [{ selector: \'mark\' }] }] }]',
      '        }',
      '      ]',
      '    }',
      '  ]',
      '};'
    ].join('\n')]);
  });

  it('leaves out the custom directives of a component, its own and the ones of its conditional bindings', () => {
    const { code, constants, functions } = generate('<user-card @@tip @if (on()) { @@mark }></user-card>');

    expect(code).toEqual(['_ssrComponent(out, context, user_card0$element);', 'out.push(\'</user-card>\');']);
    expect(constants).toEqual(['const user_card0$element = { tagName: \'user-card\' };']);
    expect(functions).toEqual([]);
  });

  it('writes an element its structural directives allow through _ssrStructural, written by a function of the module and its content by a function of its own', () => {
    const { code, functionsToProcess, constants, functions } = generate('<div *first *second(role="admin" level="{ on() }") class="x">text</div>');

    expect(code).toEqual(['_ssrStructural(out, context, div0$structural);']);
    expect(constants).toEqual([[
      'const div0$structural = {',
      '  structuralDirectives: [',
      '    { selector: \'first\' },',
      '    {',
      '      selector: \'second\',',
      '      attributes: [',
      '        { name: \'role\', value: \'admin\', setter: _setProperty },',
      '        { name: \'level\', value: div0$level, setter: _setExpressionProperty }',
      '      ]',
      '    }',
      '  ],',
      '  render: div0$render',
      '};'
    ].join('\n')]);
    expect(functions).toEqual([
      expressionFunction('div0$level', 'this.on()'),
      [
        'function div0$render(out, context) {',
        '  out.push(\'<div class="x">\');',
        '  div0Children.call(this, out, context);',
        '  out.push(\'</div>\');',
        '}'
      ].join('\n')
    ]);
    const { fn, args } = functionsToProcess!.get('div0Children')!;
    expect(fn.parent).toEqual({ id: 'div0', tag: 'div', end: true });
    expect(fn.context.namespace).toBe('html');
    expect(args).toEqual(['out', 'parentContext']);
  });

  it('tells _ssrStructural an element applying structural directives is the last node of its parent', () => {
    const context = new GeneratorContext(cache);
    generateServerElement(parseTemplate('<input *first />')[0] as ElementNode, { id: 'td0', tag: 'td', end: true }, '0', context, generateChildren, true);

    expect(context.constantDeclarations).toEqual(['const td0__input0$structural = { structuralDirectives: [{ selector: \'first\' }], last: true, render: td0__input0$render };']);
  });

  it('ignores the position of an element applying no structural directive, its children ending where it does', () => {
    generateChildren.mockClear();
    const context = new GeneratorContext(cache);
    const { pieces } = generateServerElement(parseTemplate('<p>t</p>')[0] as ElementNode, { id: 'td0', tag: 'td', end: true }, '0', context, generateChildren, true);

    expect(toStatements(pieces)).toEqual(['out.push(\'<p>{children of td0__p0}</p>\');']);
    expect(context.constantDeclarations).toEqual([]);
    expect(generateChildren).toHaveBeenCalledWith(expect.anything(), { id: 'td0__p0', tag: 'p', end: true }, context);
  });

  it('writes an element without content its structural directives allow, calling no function', () => {
    const { constants, functions, functionsToProcess } = generate('<input *first />');

    expect(constants).toEqual(['const input0$structural = { structuralDirectives: [{ selector: \'first\' }], render: input0$render };']);
    expect(functions).toEqual(['function input0$render(out, context) {\n  out.push(\'<input>\');\n}']);
    expect(functionsToProcess!.size).toBe(0);
  });

  it('describes the conditional bindings applying structural directives, nested ones included, leaving out the ones applying none', () => {
    const { code, constants, functions } = generate('<p @if (on()) { title="x" *first } @else { *second } @if (other) { @if (inner) { *third } } @if (skipped) { lang="y" }></p>');

    expect(code).toEqual(['_ssrStructural(out, context, p0$structural);']);
    expect(constants).toEqual([
      // The element writes the attributes of the conditional bindings writing any, a branch writing none kept in its place
      [
        'const p0$element = {',
        '  tagName: \'p\',',
        '  conditionalBindings: [',
        '    {',
        '      branches: [{ condition: p0$if3, attributes: [{ name: \'title\', value: \'x\', setter: _setProperty }] }, {}]',
        '    },',
        '    {',
        '      branches: [{ condition: p0$if4, attributes: [{ name: \'lang\', value: \'y\', setter: _setProperty }] }]',
        '    }',
        '  ]',
        '};'
      ].join('\n'),
      [
        'const p0$structural = {',
        '  structuralConditionalBindings: [',
        '    {',
        '      branches: [',
        '        { condition: p0$if, structuralDirectives: [{ selector: \'first\' }] },',
        '        { structuralDirectives: [{ selector: \'second\' }] }',
        '      ]',
        '    },',
        '    {',
        '      branches: [',
        '        {',
        '          condition: p0$if1,',
        '          conditionalBindings: [{ branches: [{ condition: p0$if2, structuralDirectives: [{ selector: \'third\' }] }] }]',
        '        }',
        '      ]',
        '    }',
        '  ],',
        '  render: p0$render',
        '};'
      ].join('\n')
    ]);
    expect(functions.at(-1)).toBe('function p0$render(out, context) {\n  _ssrStartTag(out, context, p0$element);\n  out.push(\'</p>\');\n}');
  });
});
