import { CompilerContext, parseTemplate, type ElementNode } from '@xaendar/compiler';
import { describe, expect, it, vi } from 'vitest';
import type { GenerateChildren } from '../../types/server-transition-function/server-transition-function.type';
import { toStatements } from '../../utils/server-code/server-code.utils';
import { generateServerElement } from './generate-server-element.state';

/**
 * Generates the children of an element as a placeholder naming where they are rendered.
 */
const generateChildren = vi.fn<GenerateChildren>((nodes, parent) => ({ pieces: nodes.length ? [{ html: `{children of ${parent.id}}` }] : [] }));

/**
 * Generates the code of the first element of a template, returning its lines and the functions it calls.
 */
const generate = (source: string, context = new CompilerContext()) => {
  context.addSignalClassField('on');
  context.addSignalClassField('mode');
  const { pieces, functionsToProcess } = generateServerElement(parseTemplate(source)[0] as ElementNode, { id: 'root' }, '0', context, generateChildren);
  return { code: toStatements(pieces), functionsToProcess };
};

describe('generateServerElement', () => {
  it('writes a native element with static and expression attributes as HTML, escaping the values of the expressions when rendered', () => {
    const { code, functionsToProcess } = generate('<a href="/x?a=1&amp;b=&quot;2&quot;" title="{ on() }">t</a>');

    expect(code).toEqual(['out.push(\'<a href="/x?a=1&amp;b=&quot;2&quot;" title="\' + _escapeAttribute(this.on()) + \'">{children of a0}</a>\');']);
    expect(functionsToProcess).toBeUndefined();
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

  it('initializes the element ref of the element as undefined before writing it', () => {
    expect(generate('<input #field />').code).toEqual(['context.set(\'field\', undefined);', 'out.push(\'<input>\');']);
  });

  it('writes the start tag of a component through _ssrComponent, and its light DOM and end tag after it', () => {
    expect(generate('<user-card name="x" label="{ on() }">light</user-card>').code).toEqual([
      '_ssrComponent(out, context, \'user-card\', [',
      '  { name: \'name\', value: \'x\', setter: _setProperty },',
      '  { name: \'label\', value: () => this.on(), setter: _setExpressionProperty },',
      '], []);',
      'out.push(\'{children of user_card0}</user-card>\');'
    ]);
  });

  it('writes a custom element of another library like a native element', () => {
    const context = new CompilerContext();
    context.addCustomElementPatterns('sl-*');

    expect(generate('<sl-button variant="primary"></sl-button>', context).code).toEqual(['out.push(\'<sl-button variant="primary"></sl-button>\');']);
  });

  it('writes the start tag of an element toggling classes through _ssrStartTag, the classes after the attributes', () => {
    expect(generate('<div class="a" [class.is-on]="{ on() }"></div>').code).toEqual([
      '_ssrStartTag(out, context, \'div\', [',
      '  { name: \'class\', value: \'a\', setter: _setProperty },',
      '  { name: \'is-on\', value: () => this.on(), setter: _setExpressionClass },',
      '], []);',
      'out.push(\'</div>\');'
    ]);
  });

  it('describes the conditional bindings writing attributes or classes, nested ones included, leaving out the ones writing nothing', () => {
    const { code } = generate([
      '<div',
      '  @if (on()) { title="x" @if (inner) { id="y" } } @else if (other) { [class.on]="{ 1 }" } @else { title="z" }',
      '  @switch (mode()) { @case (\'a\') @case (\'b\') { lang="x" } @default { lang="y" } }',
      '  @if (events) { (click)="f()" @@tooltip }',
      '></div>'
    ].join(' '));

    expect(code).toEqual([
      '_ssrStartTag(out, context, \'div\', [], [',
      '  {',
      '    branches: [',
      '      {',
      '        condition: () => this.on(),',
      '        attributes: [',
      '          { name: \'title\', value: \'x\', setter: _setProperty },',
      '        ],',
      '        conditionalBindings: [',
      '          {',
      '            branches: [',
      '              {',
      '                condition: () => this.inner,',
      '                attributes: [',
      '                  { name: \'id\', value: \'y\', setter: _setProperty },',
      '                ],',
      '                conditionalBindings: []',
      '              },',
      '            ]',
      '          },',
      '        ]',
      '      },',
      '      {',
      '        condition: () => this.other,',
      '        attributes: [',
      '          { name: \'on\', value: () => 1, setter: _setExpressionClass },',
      '        ],',
      '        conditionalBindings: []',
      '      },',
      '      {',
      '        attributes: [',
      '          { name: \'title\', value: \'z\', setter: _setProperty },',
      '        ],',
      '        conditionalBindings: []',
      '      },',
      '    ]',
      '  },',
      '  {',
      '    expression: () => this.mode(),',
      '    branches: [',
      '      {',
      '        condition: [\'a\', \'b\'],',
      '        attributes: [',
      '          { name: \'lang\', value: \'x\', setter: _setProperty },',
      '        ],',
      '        conditionalBindings: []',
      '      },',
      '      {',
      '        condition: null,',
      '        attributes: [',
      '          { name: \'lang\', value: \'y\', setter: _setProperty },',
      '        ],',
      '        conditionalBindings: []',
      '      },',
      '    ]',
      '  },',
      ']);',
      'out.push(\'</div>\');'
    ]);
  });

  it('writes an element its structural directives allow through _ssrStructural, its content rendered by a function of its own', () => {
    const { code, functionsToProcess } = generate('<div *first *second(role="admin" level="{ on() }") class="x">text</div>');

    expect(code).toEqual([
      '_ssrStructural(out, context, [',
      '  {',
      '    selector: \'first\',',
      '    attributes: []',
      '  },',
      '  {',
      '    selector: \'second\',',
      '    attributes: [',
      '      { name: \'role\', value: \'admin\', setter: _setProperty },',
      '      { name: \'level\', value: () => this.on(), setter: _setExpressionProperty },',
      '    ]',
      '  },',
      '], [], (out, context) => {',
      '  out.push(\'<div class="x">\');',
      '  div0Children.call(this, out, context);',
      '  out.push(\'</div>\');',
      '});'
    ]);
    const { fn, args } = functionsToProcess!.get('div0Children')!;
    expect(fn.parent).toEqual({ id: 'div0', tag: 'div' });
    expect(fn.context.namespace).toBe('html');
    expect(args).toEqual(['out', 'parentContext']);
  });

  it('writes an element without content its structural directives allow, calling no function', () => {
    const { code, functionsToProcess } = generate('<input *first />');

    expect(code.slice(-3)).toEqual(['], [], (out, context) => {', '  out.push(\'<input>\');', '});']);
    expect(functionsToProcess!.size).toBe(0);
  });

  it('describes the conditional bindings applying structural directives, nested ones included, leaving out the ones applying none', () => {
    const { code } = generate('<p @if (on()) { title="x" *first } @else { *second } @if (other) { @if (inner) { *third } } @if (skipped) { lang="y" }></p>');
    const structural = code.join('\n');

    expect(structural).toContain([
      '_ssrStructural(out, context, [], [',
      '  {',
      '    branches: [',
      '      {',
      '        condition: () => this.on(),',
      '        structuralDirectives: [',
      '          {',
      '            selector: \'first\',',
      '            attributes: []',
      '          },',
      '        ],',
      '        conditionalBindings: []',
      '      },',
      '      {',
      '        structuralDirectives: [',
      '          {',
      '            selector: \'second\',',
      '            attributes: []',
      '          },',
      '        ],',
      '        conditionalBindings: []',
      '      },',
      '    ]',
      '  },',
      '  {',
      '    branches: [',
      '      {',
      '        condition: () => this.other,',
      '        structuralDirectives: [],',
      '        conditionalBindings: [',
      '          {',
      '            branches: [',
      '              {',
      '                condition: () => this.inner,',
      '                structuralDirectives: [',
      '                  {',
      '                    selector: \'third\',',
      '                    attributes: []',
      '                  },',
      '                ],',
      '                conditionalBindings: []',
      '              },',
      '            ]',
      '          },',
      '        ]',
      '      },',
      '    ]',
      '  },',
      '], (out, context) => {'
    ].join('\n'));
    // The element writes the attributes of the conditional bindings writing any
    expect(structural).toContain('condition: () => this.skipped,');
    expect(structural).not.toContain('condition: () => this.other,\n            attributes');
  });
});
