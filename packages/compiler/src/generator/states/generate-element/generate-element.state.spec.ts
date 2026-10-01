import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import { ElementNode } from '../../../parser/types/nodes/element-node.type';
import type { CompilerCache } from '../../../types/compiler-cache.type';
import { ComponentPropertyMetadata } from '../../../type-checker/models/component-property-metadata/component-property-metadata.model';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import { generateElement } from './generate-element.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as ElementNode;

const cacheWith = (properties: Record<string, ComponentPropertyMetadata>): CompilerCache => ({
  getOrInsert: async () => ({ properties: new Map(Object.entries(properties)) }) as never,
  set: () => undefined
});

const run = async (template: string, context = new CompilerContext(), anchor: string | null = null) => generateElement(parse(template), 'root', '0', context, anchor);

/**
 * Asserts the generated lines are valid JavaScript statements.
 */
const expectValidJavascript = (code: string[]) => expect(() => new Function(code.join('\n'))).not.toThrow();

describe('generateElement', () => {
  it('generates a bare element', async () => {
    const { code, functionsToProcess } = await run('<div></div>');
    expect(code).toEqual(['const div0 = _renderElement(root, context, null, \'div\', [], [], [], []);']);
    expect(functionsToProcess?.size).toBe(0);
  });

  it('forwards the anchor', async () => {
    const { code } = await run('<div></div>', new CompilerContext(), 'anchor');
    expect(code[0]).toContain('context, anchor, \'div\'');
  });

  it('generates literal, expression and reactive attributes', async () => {
    const context = new CompilerContext();
    context.addSignalClassField('count');
    const { code } = await run('<div class="a" title="{name}" id="{count}"></div>', context);
    const output = code.join('\n');

    expect(output).toContain('value: \'a\',');
    expect(output).toContain('setter: _setProperty');
    expect(output).toContain('value: () => this.name, ');
    expect(output).toContain('setter: _setExpressionProperty');
    expect(output).toContain('setter: _setReactiveProperty');
  });

  it('generates events with and without parameters', async () => {
    const { code } = await run('<div (click)="f($event, a, $event)" (focus)="g()"></div>');
    const output = code.join('\n');

    expect(output).toContain('($event) => $event,');
    expect(output).toContain('() => this.a,');
    expect(output).toContain('() => $event,');
    expect(output).toContain('handler: \'g\',');
    expect(output).toContain('parameters: []');
  });

  it('does not leak $event into the context after generating events', async () => {
    const context = new CompilerContext();
    await run('<div (click)="f($event)"></div>', context);

    expect(context.hasUnresolvableIdentifier('$event')).toBe(false);
    expect(() => context.addUnresolvableIdentifier('$event')).not.toThrow();
  });

  it('registers a children function when the element has children', async () => {
    const { code, functionsToProcess } = await run('<div><span></span></div>');
    expect(code).toContain('div0Children.call(this, div0, context);');
    expect(functionsToProcess?.get('div0Children')).toMatchObject({
      fn: { parentNode: 'div0', precode: '' },
      args: ['div0', 'parentContext', 'anchor']
    });
  });

  it.each([
    ['svg', 'context.createElement = _createSVGElement;'],
    ['math', 'context.createElement = _createMATHMLElement;']
  ])('overrides the element factory for %s', async (tag, precode) => {
    const { code, functionsToProcess } = await run(`<${tag}><b></b></${tag}>`);
    expect(code[0]).toBe(precode);
    expect(code).toContain('context.createElement = _createElement;');
    expect(functionsToProcess?.get(`${tag}0Children`)?.fn.precode).toBe(precode);
  });

  describe('conditional bindings', () => {
    it('skips the conditional bindings whose branches declare no binding', async () => {
      const { code } = await run('<div @if (cond()) { } @else { } @switch (mode()) { @case (1) { } } @switch (mode()) { }></div>');
      expect(code).toEqual(['const div0 = _renderElement(root, context, null, \'div\', [], [], [], []);']);
    });

    it('keeps the branches declaring no binding of a conditional binding declaring some', async () => {
      const { code } = await run('<div @if (cond()) { } @else { title="x" }></div>');

      expect(code).toEqual([
        'const div0 = _renderElement(root, context, null, \'div\', [], [],',
        '  [',
        '    {',
        '      branches: [',
        '        {',
        '          condition: () => this.cond(),',
        '          attributes: [],',
        '          events: [],',
        '          conditionalBindings: [],',
        '          directives: [],',
        '        },',
        '        {',
        '          attributes: [',
        '            {',
        '              name: \'title\',',
        '              value: \'x\',',
        '              setter: _setProperty,',
        '              unbind: _removeAttribute',
        '            },',
        '          ],',
        '          events: [],',
        '          conditionalBindings: [],',
        '          directives: [],',
        '        },',
        '      ]',
        '    },',
        '  ], []);'
      ]);
      expectValidJavascript(code);
    });

    it('generates attributes, events and nested bindings', async () => {
      const { code } = await run('<div @if (cond()) { title="x" (click)="f()" @if (inner()) { id="y" } }></div>');
      const output = code.join('\n');

      expect(output).toContain('branches: [');
      expect(output).toContain('condition: () => this.cond(),');
      expect(output).toContain('condition: () => this.inner(),');
      expect(output).toContain('attributes: [');
      expect(output).toContain('events: [');
      expect(output).toContain('conditionalBindings: [');
      expect(output).toContain('unbind: _removeAttribute');
      expectValidJavascript(code);
    });

    it('generates empty attribute, event and nested lists when absent', async () => {
      const { code } = await run('<div @if (cond()) { @if (inner()) { id="y" } }></div>');
      const output = code.join('\n');

      expect(output).toContain('attributes: [],');
      expect(output).toContain('events: [],');
      expect(output).toContain('conditionalBindings: [],');
      expect(output).toContain('directives: [],');
      expectValidJavascript(code);
    });

    it('generates the branches of an @if chain in declaration order, the @else one having no condition', async () => {
      const { code } = await run('<div @if (a()) { title="x" } @else if (b()) { title="y" } @else { title="z" }></div>');

      expect(code).toEqual([
        'const div0 = _renderElement(root, context, null, \'div\', [], [],',
        '  [',
        '    {',
        '      branches: [',
        '        {',
        '          condition: () => this.a(),',
        '          attributes: [',
        '            {',
        '              name: \'title\',',
        '              value: \'x\',',
        '              setter: _setProperty,',
        '              unbind: _removeAttribute',
        '            },',
        '          ],',
        '          events: [],',
        '          conditionalBindings: [],',
        '          directives: [],',
        '        },',
        '        {',
        '          condition: () => this.b(),',
        '          attributes: [',
        '            {',
        '              name: \'title\',',
        '              value: \'y\',',
        '              setter: _setProperty,',
        '              unbind: _removeAttribute',
        '            },',
        '          ],',
        '          events: [],',
        '          conditionalBindings: [],',
        '          directives: [],',
        '        },',
        '        {',
        '          attributes: [',
        '            {',
        '              name: \'title\',',
        '              value: \'z\',',
        '              setter: _setProperty,',
        '              unbind: _removeAttribute',
        '            },',
        '          ],',
        '          events: [],',
        '          conditionalBindings: [],',
        '          directives: [],',
        '        },',
        '      ]',
        '    },',
        '  ], []);'
      ]);
      expectValidJavascript(code);
    });

    it('generates the expression of a @switch and the values of its branches, the @default one having none', async () => {
      const context = new CompilerContext();
      context.addSignalClassField('mode');
      const { code } = await run('<div @switch (mode()) { @case (\'a\') @case (\'b\') { title="x" } @default { id="y" } }></div>', context);

      expect(code).toEqual([
        'const div0 = _renderElement(root, context, null, \'div\', [], [],',
        '  [',
        '    {',
        '      expression: () => this.mode(),',
        '      branches: [',
        '        {',
        '          condition: [\'a\', \'b\'],',
        '          attributes: [',
        '            {',
        '              name: \'title\',',
        '              value: \'x\',',
        '              setter: _setProperty,',
        '              unbind: _removeAttribute',
        '            },',
        '          ],',
        '          events: [],',
        '          conditionalBindings: [],',
        '          directives: [],',
        '        },',
        '        {',
        '          condition: null,',
        '          attributes: [',
        '            {',
        '              name: \'id\',',
        '              value: \'y\',',
        '              setter: _setProperty,',
        '              unbind: _removeAttribute',
        '            },',
        '          ],',
        '          events: [],',
        '          conditionalBindings: [],',
        '          directives: [],',
        '        },',
        '      ]',
        '    },',
        '  ], []);'
      ]);
      expectValidJavascript(code);
    });

    it('resolves the conditions and the expressions against the current scope', async () => {
      const context = new CompilerContext(undefined, ['item']);
      const { code } = await run('<div @if (item.active) { title="x" } @switch (item.kind) { @case (1) { id="y" } }></div>', context);
      const output = code.join('\n');

      expect(output).toContain('condition: () => context.get(\'item\').active,');
      expect(output).toContain('expression: () => context.get(\'item\').kind,');
    });

    it('does not query the metadata of a native element', async () => {
      const context = new CompilerContext();
      context.cache = { getOrInsert: async () => { throw new Error('No metadata'); }, set: () => undefined };
      const { code } = await run('<div @if (cond()) { title="x" }></div>', context);

      expect(code.join('\n')).toContain('unbind: _removeAttribute');
    });

    it('generates the directives applied inside a conditional binding', async () => {
      const { code } = await run('<div @if (cond()) { title="x" @@first @if (inner()) { @@second(display="block") } }></div>');

      expect(code).toEqual([
        'const div0 = _renderElement(root, context, null, \'div\', [], [],',
        '  [',
        '    {',
        '      branches: [',
        '        {',
        '          condition: () => this.cond(),',
        '          attributes: [',
        '            {',
        '              name: \'title\',',
        '              value: \'x\',',
        '              setter: _setProperty,',
        '              unbind: _removeAttribute',
        '            },',
        '          ],',
        '          events: [],',
        '          conditionalBindings: [',
        '            {',
        '              branches: [',
        '                {',
        '                  condition: () => this.inner(),',
        '                  attributes: [],',
        '                  events: [],',
        '                  conditionalBindings: [],',
        '                  directives: [',
        '                    {',
        '                      selector: \'second\',',
        '                      attributes: [',
        '                        {',
        '                          name: \'display\',',
        '                          value: \'block\',',
        '                          setter: _setProperty',
        '                        },',
        '                      ],',
        '                      events: [],',
        '                      conditionalBindings: []',
        '                    },',
        '                  ],',
        '                },',
        '              ]',
        '            },',
        '          ],',
        '          directives: [',
        '            {',
        '              selector: \'first\',',
        '              attributes: [],',
        '              events: [],',
        '              conditionalBindings: []',
        '            },',
        '          ],',
        '        },',
        '      ]',
        '    },',
        '  ], []);'
      ]);
      expectValidJavascript(code);
    });

    it('uses the component metadata to describe known optional properties', async () => {
      const context = new CompilerContext();
      context.cache = cacheWith({ title: new ComponentPropertyMetadata('title', 'string', { required: false, defaultValue: '\'d\'' }) });
      const { code } = await run('<my-el @if (cond()) { title="x" } @else { title="y" }></my-el>', context);
      const output = code.join('\n');

      expect(output.match(/unbind: _setExpressionProperty,/g)).toHaveLength(2);
      expect(output.match(/defaultValue: 'd'/g)).toHaveLength(2);
    });

    it('separates the descriptors of several conditional bindings', async () => {
      const { code } = await run('<div @if (first()) { title="x" } @if (second()) { id="y" } @switch (mode()) { @case (1) { lang="z" } }></div>');

      expect(code.filter(line => line.trim() === 'branches: [')).toHaveLength(3);
      expectValidJavascript(code);
    });

    it('does not add unbind information for required properties, which the branch selected next binds again', async () => {
      const context = new CompilerContext();
      context.cache = cacheWith({
        title: new ComponentPropertyMetadata('title', 'string', { required: true }),
        label: new ComponentPropertyMetadata('label', 'string', { required: false, defaultValue: '\'d\'' })
      });
      const { code } = await run('<my-el @if (cond()) { title="x" label="l" } @else { title="y" }></my-el>', context);

      expect(code).toEqual([
        'const my_el0 = _renderElement(root, context, null, \'my-el\', [], [],',
        '  [',
        '    {',
        '      branches: [',
        '        {',
        '          condition: () => this.cond(),',
        '          attributes: [',
        '            {',
        '              name: \'title\',',
        '              value: \'x\',',
        '              setter: _setProperty',
        '            },',
        '            {',
        '              name: \'label\',',
        '              value: \'l\',',
        '              setter: _setProperty,',
        '              unbind: _setExpressionProperty,',
        '              defaultValue: \'d\'',
        '            },',
        '          ],',
        '          events: [],',
        '          conditionalBindings: [],',
        '          directives: [],',
        '        },',
        '        {',
        '          attributes: [',
        '            {',
        '              name: \'title\',',
        '              value: \'y\',',
        '              setter: _setProperty',
        '            },',
        '          ],',
        '          events: [],',
        '          conditionalBindings: [],',
        '          directives: [],',
        '        },',
        '      ]',
        '    },',
        '  ], []);'
      ]);
      expectValidJavascript(code);
    });
  });

  describe('directives', () => {
    it('passes a directive declared without bindings as the last argument', async () => {
      const { code } = await run('<div @@myDirective></div>');

      expect(code).toEqual([
        'const div0 = _renderElement(root, context, null, \'div\', [], [], [],',
        '  [',
        '    {',
        '      selector: \'myDirective\',',
        '      attributes: [],',
        '      events: [],',
        '      conditionalBindings: []',
        '    },',
        '  ]',
        ');'
      ]);
    });

    it('generates the conditional bindings of a directive, resetting its properties to their default value', async () => {
      const selectors = new Array<string>();
      const context = new CompilerContext();
      context.addSignalClassField('mode');
      context.cache = {
        getOrInsert: async selector => {
          selectors.push(selector);
          return {
            properties: new Map([
              ['display', new ComponentPropertyMetadata('display', 'string', { required: false, defaultValue: '\'d\'' })],
              ['title', new ComponentPropertyMetadata('title', 'string', { required: false, defaultValue: '\'t\'' })]
            ])
          } as never;
        },
        set: () => undefined
      };
      const { code } = await run('<div @@myDirective(label="x" @if (cond()) { display="{mode()}" (toggled)="onToggled()" @if (inner()) { title="z" } } @else { display="none" })></div>', context);

      expect(selectors).toEqual(['@@myDirective', '@@myDirective', '@@myDirective']);
      expect(code).toEqual([
        'const div0 = _renderElement(root, context, null, \'div\', [], [], [],',
        '  [',
        '    {',
        '      selector: \'myDirective\',',
        '      attributes: [',
        '        {',
        '          name: \'label\',',
        '          value: \'x\',',
        '          setter: _setProperty',
        '        },',
        '      ],',
        '      events: [],',
        '      conditionalBindings: [',
        '        {',
        '          branches: [',
        '            {',
        '              condition: () => this.cond(),',
        '              attributes: [',
        '                {',
        '                  name: \'display\',',
        '                  value: () => this.mode(), ',
        '                  setter: _setReactiveProperty,',
        '                  unbind: _setExpressionProperty,',
        '                  defaultValue: \'d\'',
        '                },',
        '              ],',
        '              events: [',
        '                {',
        '                  name: \'toggled\',',
        '                  handler: \'onToggled\',',
        '                  parameters: []',
        '                },',
        '              ],',
        '              conditionalBindings: [',
        '                {',
        '                  branches: [',
        '                    {',
        '                      condition: () => this.inner(),',
        '                      attributes: [',
        '                        {',
        '                          name: \'title\',',
        '                          value: \'z\',',
        '                          setter: _setProperty,',
        '                          unbind: _setExpressionProperty,',
        '                          defaultValue: \'t\'',
        '                        },',
        '                      ],',
        '                      events: [],',
        '                      conditionalBindings: [],',
        '                    },',
        '                  ]',
        '                },',
        '              ],',
        '            },',
        '            {',
        '              attributes: [',
        '                {',
        '                  name: \'display\',',
        '                  value: \'none\',',
        '                  setter: _setProperty,',
        '                  unbind: _setExpressionProperty,',
        '                  defaultValue: \'d\'',
        '                },',
        '              ],',
        '              events: [],',
        '              conditionalBindings: [],',
        '            },',
        '          ]',
        '        },',
        '      ]',
        '    },',
        '  ]',
        ');'
      ]);
      expectValidJavascript(code);
    });

    it('generates the expression and the branches of a @switch declared in a directive', async () => {
      const context = new CompilerContext();
      context.cache = cacheWith({ display: new ComponentPropertyMetadata('display', 'string', { required: false, defaultValue: '\'d\'' }) });
      const { code } = await run('<div @@myDirective(@switch (mode()) { @case (1) { display="block" } @default { (toggled)="onToggled()" } })></div>', context);
      const output = code.join('\n');

      expect(output).toContain('expression: () => this.mode(),');
      expect(output).toContain('condition: [1],');
      expect(output).toContain('condition: null,');
      expect(output).not.toContain('directives:');
      expectValidJavascript(code);
    });

    it('throws when the metadata of a directive property bound inside a conditional binding is not available', async () => {
      await expect(run('<div @@myDirective(@if (cond()) { display="block" })></div>')).rejects.toThrow('Unable to resolve the metadata of property "display" of @@myDirective');
    });

    it('throws when the directive metadata does not declare a property bound inside a conditional binding', async () => {
      const context = new CompilerContext();
      context.cache = cacheWith({ display: new ComponentPropertyMetadata('display', 'string') });

      await expect(run('<div @@myDirective(@if (cond()) { other="x" })></div>', context)).rejects.toThrow('Unable to resolve the metadata of property "other" of @@myDirective');
    });

    it('generates the properties and events of a directive, without unbind information', async () => {
      const context = new CompilerContext();
      context.addSignalClassField('mode');
      context.cache = cacheWith({ display: new ComponentPropertyMetadata('display', 'string', { required: false, defaultValue: '\'d\'' }) });
      const { code } = await run('<my-el @@myDirective(display="block" mode="{mode}" (toggled)="onToggled($event)")></my-el>', context);
      const output = code.join('\n');

      expect(output).toContain('selector: \'myDirective\',');
      expect(output).toContain('value: \'block\',');
      expect(output).toContain('setter: _setReactiveProperty');
      expect(output).toContain('handler: \'onToggled\',');
      expect(output).toContain('($event) => $event,');
      expect(output).not.toContain('unbind');
      expectValidJavascript(code);
    });

    it('passes the directives after the conditional bindings', async () => {
      const { code } = await run('<div class="a" @if (cond()) { title="x" } @@first @@second(display="block")></div>');
      const output = code.join('\n');

      expect(output.indexOf('condition: () => this.cond(),')).toBeLessThan(output.indexOf('selector: \'first\','));
      expect(output.indexOf('selector: \'first\',')).toBeLessThan(output.indexOf('selector: \'second\','));
      expectValidJavascript(code);
    });

    it('passes an empty conditional binding list before the directives', async () => {
      const { code } = await run('<div @@myDirective(display="block")></div>');

      expect(code[0]).toBe('const div0 = _renderElement(root, context, null, \'div\', [], [], [],');
      expectValidJavascript(code);
    });
  });
});
