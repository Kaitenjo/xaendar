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
  it('generates a bare element, without a function rendering its children', async () => {
    const { code, functionsToProcess } = await run('<div></div>');
    expect(code).toEqual(['_renderElement(root, context, null, \'div\', [], [], [], [], [], [], null);']);
    expect(functionsToProcess?.size).toBe(0);
  });

  it('forwards the anchor', async () => {
    const { code } = await run('<div></div>', new CompilerContext(), 'anchor');
    expect(code[0]).toContain('context, anchor, \'div\'');
  });

  it('generates literal, expression and reactive attributes', async () => {
    const context = new CompilerContext();
    context.addSignalClassField('count');
    const { code } = await run('<div class="a" title="{heading}" id="{count}"></div>', context);
    const output = code.join('\n');

    expect(output).toContain('value: \'a\',');
    expect(output).toContain('setter: _setProperty');
    expect(output).toContain('value: () => this.heading,');
    expect(output).toContain('setter: _setExpressionProperty');
    expect(output).toContain('setter: _setReactiveProperty');
  });

  it('wraps an object literal attribute value in parentheses', async () => {
    const { code } = await run('<div title="{{ a: b }}"></div>');

    expect(code.join('\n')).toContain('value: () => ({ a: this.b }),');
    expectValidJavascript(code);
  });

  it('generates events with and without parameters', async () => {
    const { code } = await run('<div (click)="f($event, a, $event)" (focus)="g()"></div>');
    const output = code.join('\n');

    expect(output).toContain('handler: ($event) => this.f($event, this.a, $event)');
    expect(output).toContain('handler: () => this.g()');
    expectValidJavascript(code);
  });

  it('calls a method of a member on that member', async () => {
    const context = new CompilerContext();
    context.addSignalClassField('count');
    const { code } = await run('<div (click)="helper.run($event)" (focus)="count.set(1)" (blur)="helper?.stop()"></div>', context);
    const output = code.join('\n');

    expect(output).toContain('handler: ($event) => this.helper.run($event)');
    expect(output).toContain('handler: () => this.count.set(1)');
    expect(output).toContain('handler: () => this.helper?.stop()');
    expectValidJavascript(code);
  });

  it('calls on the component a method named like a reserved word', async () => {
    const { code } = await run('<div (click)="delete()" (focus)="void($event)" (blur)="new.run(a)"></div>');
    const output = code.join('\n');

    expect(output).toContain('handler: () => this.delete()');
    expect(output).toContain('handler: ($event) => this.void($event)');
    expect(output).toContain('handler: () => this.new.run(this.a)');
    expectValidJavascript(code);
  });

  it('rejects a handler starting with a reserved word that is not a valid expression', async () => {
    await expect(run('<div (click)="delete[a=1]()"></div>')).rejects.toThrow('is not allowed inside template expressions');
  });

  it('does not leak $event into the context after generating events', async () => {
    const context = new CompilerContext();
    await run('<div (click)="f($event)"></div>', context);

    expect(context.hasUnresolvableIdentifier('$event')).toBe(false);
    expect(() => context.addUnresolvableIdentifier('$event')).not.toThrow();
  });

  it('registers a children function when the element has children, passing it as last argument', async () => {
    const { code, functionsToProcess } = await run('<div><span></span></div>');
    expect(code).toEqual([
      '_renderElement(root, context, null, \'div\', [], [], [], [], [], [],',
      '  (div0, parentContext) => div0Children.call(this, div0, parentContext)',
      ');'
    ]);
    expect(functionsToProcess?.get('div0Children')).toMatchObject({
      fn: { parentNode: 'div0', precode: '' },
      args: ['div0', 'parentContext', 'anchor']
    });
  });

  it('passes the element ref naming the element after its children, rendering them in the scope of the element', async () => {
    const context = new CompilerContext();
    const { code, functionsToProcess } = await run('<div #panel><span></span></div>', context);
    expect(code).toEqual([
      '_renderElement(root, context, null, \'div\', [], [], [], [], [], [],',
      '  (div0, parentContext) => div0Children.call(this, div0, parentContext), \'panel\'',
      ');'
    ]);
    expect(functionsToProcess?.get('div0Children')?.fn.context).toBe(context);
    expectValidJavascript(code);
  });

  it('passes the element ref naming an element without children after the null children', async () => {
    const { code } = await run('<input #field />');
    expect(code).toEqual(['_renderElement(root, context, null, \'input\', [], [], [], [], [], [], null, \'field\');']);
  });

  it('renders the children of an element a structural directive is applied to in a scope of their own', async () => {
    const context = new CompilerContext();
    const { functionsToProcess } = await run('<div *visible><span></span></div>', context);
    const childrenContext = functionsToProcess?.get('div0Children')?.fn.context;
    expect(childrenContext).not.toBe(context);
    expect(childrenContext).toBeInstanceOf(CompilerContext);
  });

  it.each([
    ['an <svg>', '<svg><g /></svg>', 'svg0Children', new CompilerContext(), 'svg'],
    ['a <math>', '<math><mi /></math>', 'math0Children', new CompilerContext(), 'mathml'],
    ['a <foreignObject>', '<foreignObject><div /></foreignObject>', 'foreignObject0Children', new CompilerContext(undefined, 'svg'), 'html']
  ])('renders the children of %s in a context of their namespace', async (_description, template, key, context, namespace) => {
    const { functionsToProcess } = await run(template, context);
    const childrenContext = functionsToProcess?.get(key)?.fn.context;
    expect(childrenContext).not.toBe(context);
    expect(childrenContext?.namespace).toBe(namespace);
  });

  it('renders the children of an element keeping the namespace of its scope in the same context', async () => {
    const context = new CompilerContext(undefined, 'svg');
    const { functionsToProcess } = await run('<g><circle /></g>', context);
    expect(functionsToProcess?.get('g0Children')?.fn.context).toBe(context);
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

  it('creates the children of a foreignObject as HTML elements, keeping the foreignObject in the namespace of its parent', async () => {
    const { code, functionsToProcess } = await run('<foreignObject><div></div></foreignObject>');
    expect(code.join('\n')).not.toContain('context.createElement');
    expect(functionsToProcess?.get('foreignObject0Children')?.fn.precode).toBe('context.createElement = _createElement;');
  });

  it('generates the classes toggled on the element after its attributes, with a setter toggling them', async () => {
    const context = new CompilerContext();
    context.addSignalClassField('active');
    const { code } = await run('<div [class.is-on]="{active()}" title="x" [class.big]="{size > 1}"></div>', context);

    expect(code).toEqual([
      '_renderElement(root, context, null, \'div\',',
      '  [',
      '    {',
      '      name: \'title\',',
      '      value: \'x\',',
      '      setter: _setProperty',
      '    },',
      '    {',
      '      name: \'is-on\',',
      '      value: () => this.active(),',
      '      setter: _setReactiveClass',
      '    },',
      '    {',
      '      name: \'big\',',
      '      value: () => this.size > 1,',
      '      setter: _setExpressionClass',
      '    },',
      '  ], [], [], [], [], [], null);'
    ]);
    expectValidJavascript(code);
  });

  describe('conditional bindings', () => {
    it('generates the classes toggled by a branch, removed when it is no longer selected, even when the branch toggles nothing else', async () => {
      const { code } = await run('<div @if (cond()) { [class.on]="{1}" }></div>');

      expect(code).toEqual([
        '_renderElement(root, context, null, \'div\', [], [],',
        '  [',
        '    {',
        '      branches: [',
        '        {',
        '          condition: () => this.cond(),',
        '          attributes: [',
        '            {',
        '              name: \'on\',',
        '              value: () => 1,',
        '              setter: _setExpressionClass,',
        '              unbind: _removeClass',
        '            },',
        '          ],',
        '          events: [],',
        '          conditionalBindings: [],',
        '          directives: [],',
        '        },',
        '      ]',
        '    },',
        '  ], [], [], [], null);'
      ]);
      expectValidJavascript(code);
    });

    it('skips the conditional bindings whose branches declare no binding', async () => {
      const { code } = await run('<div @if (cond()) { } @else { } @switch (mode()) { @case (1) { } } @switch (mode()) { }></div>');
      expect(code).toEqual(['_renderElement(root, context, null, \'div\', [], [], [], [], [], [], null);']);
    });

    it('keeps the branches declaring no binding of a conditional binding declaring some', async () => {
      const { code } = await run('<div @if (cond()) { } @else { title="x" }></div>');

      expect(code).toEqual([
        '_renderElement(root, context, null, \'div\', [], [],',
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
        '  ], [], [], [], null);'
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
        '_renderElement(root, context, null, \'div\', [], [],',
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
        '  ], [], [], [], null);'
      ]);
      expectValidJavascript(code);
    });

    it('generates the expression of a @switch and the values of its branches, the @default one having none', async () => {
      const context = new CompilerContext();
      context.addSignalClassField('mode');
      const { code } = await run('<div @switch (mode()) { @case (\'a\') @case (\'b\') { title="x" } @default { id="y" } }></div>', context);

      expect(code).toEqual([
        '_renderElement(root, context, null, \'div\', [], [],',
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
        '  ], [], [], [], null);'
      ]);
      expectValidJavascript(code);
    });

    it('resolves the conditions and the expressions against the current scope', async () => {
      const context = new CompilerContext();
      context.addIdentifier('item');
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

    it('generates a custom element of another library like a native element, without querying its metadata', async () => {
      const context = new CompilerContext();
      context.cache = { getOrInsert: async () => { throw new Error('No metadata'); }, set: () => undefined };
      context.addCustomElementPatterns('sl-*');
      const { code } = await run('<sl-button @if (cond()) { variant="primary" }></sl-button>', context);

      expect(code.join('\n')).toContain('unbind: _removeAttribute');
    });

    it('generates the directives applied inside a conditional binding', async () => {
      const { code } = await run('<div @if (cond()) { title="x" @@first @if (inner()) { @@second(display="block") } }></div>');

      expect(code).toEqual([
        '_renderElement(root, context, null, \'div\', [], [],',
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
        '  ], [], [], [], null);'
      ]);
      expectValidJavascript(code);
    });

    it('uses the component metadata to describe known optional properties', async () => {
      const context = new CompilerContext();
      context.cache = cacheWith({ title: new ComponentPropertyMetadata('title', 'string', { required: false }) });
      const { code } = await run('<my-el @if (cond()) { title="x" } @else { title="y" }></my-el>', context);
      const output = code.join('\n');

      expect(output.match(/unbind: _resetProperty/g)).toHaveLength(2);
      expect(output).not.toContain('defaultValue');
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
        label: new ComponentPropertyMetadata('label', 'string', { required: false })
      });
      const { code } = await run('<my-el @if (cond()) { title="x" label="l" } @else { title="y" }></my-el>', context);

      expect(code).toEqual([
        '_renderElement(root, context, null, \'my-el\', [], [],',
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
        '              unbind: _resetProperty',
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
        '  ], [], [], [], null);'
      ]);
      expectValidJavascript(code);
    });
  });

  describe('directives', () => {
    it('passes a directive declared without bindings', async () => {
      const { code } = await run('<div @@myDirective></div>');

      expect(code).toEqual([
        '_renderElement(root, context, null, \'div\', [], [], [],',
        '  [',
        '    {',
        '      selector: \'myDirective\',',
        '      attributes: [],',
        '      events: [],',
        '      conditionalBindings: []',
        '    },',
        '  ], [], [], null);'
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
              ['display', new ComponentPropertyMetadata('display', 'string', { required: false })],
              ['title', new ComponentPropertyMetadata('title', 'string', { required: false })]
            ])
          } as never;
        },
        set: () => undefined
      };
      const { code } = await run('<div @@myDirective(label="x" @if (cond()) { display="{mode()}" (toggled)="onToggled()" @if (inner()) { title="z" } } @else { display="none" })></div>', context);

      expect(selectors).toEqual(['@@myDirective', '@@myDirective', '@@myDirective']);
      expect(code).toEqual([
        '_renderElement(root, context, null, \'div\', [], [], [],',
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
        '                  value: () => this.mode(),',
        '                  setter: _setReactiveProperty,',
        '                  unbind: _resetProperty',
        '                },',
        '              ],',
        '              events: [',
        '                {',
        '                  name: \'toggled\',',
        '                  handler: () => this.onToggled()',
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
        '                          unbind: _resetProperty',
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
        '                  unbind: _resetProperty',
        '                },',
        '              ],',
        '              events: [],',
        '              conditionalBindings: [],',
        '            },',
        '          ]',
        '        },',
        '      ]',
        '    },',
        '  ], [], [], null);'
      ]);
      expectValidJavascript(code);
    });

    it('generates the expression and the branches of a @switch declared in a directive', async () => {
      const context = new CompilerContext();
      context.cache = cacheWith({ display: new ComponentPropertyMetadata('display', 'string', { required: false }) });
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
      context.cache = cacheWith({ display: new ComponentPropertyMetadata('display', 'string', { required: false }) });
      const { code } = await run('<my-el @@myDirective(display="block" mode="{mode}" (toggled)="onToggled($event)")></my-el>', context);
      const output = code.join('\n');

      expect(output).toContain('selector: \'myDirective\',');
      expect(output).toContain('value: \'block\',');
      expect(output).toContain('setter: _setReactiveProperty');
      expect(output).toContain('handler: ($event) => this.onToggled($event)');
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

      expect(code[0]).toBe('_renderElement(root, context, null, \'div\', [], [], [],');
      expectValidJavascript(code);
    });
  });

  describe('structural directives', () => {
    it('passes the structural directives and an empty structural conditional binding list', async () => {
      const { code, functionsToProcess } = await run('<div *first *second(role="admin" level="{count()}")></div>');

      expect(code).toEqual([
        '_renderElement(root, context, null, \'div\', [], [], [], [],',
        '  [',
        '    {',
        '      selector: \'first\',',
        '      attributes: []',
        '    },',
        '    {',
        '      selector: \'second\',',
        '      attributes: [',
        '        {',
        '          name: \'role\',',
        '          value: \'admin\',',
        '          setter: _setProperty',
        '        },',
        '        {',
        '          name: \'level\',',
        '          value: () => this.count(),',
        '          setter: _setExpressionProperty',
        '        },',
        '      ]',
        '    },',
        '  ], [], null);'
      ]);
      expect(functionsToProcess?.size).toBe(0);
      expectValidJavascript(code);
    });

    it('passes the function rendering the children, each time the element is created, as last argument', async () => {
      const { code, functionsToProcess } = await run('<div *first><span></span></div>');

      expect(code).toEqual([
        '_renderElement(root, context, null, \'div\', [], [], [], [],',
        '  [',
        '    {',
        '      selector: \'first\',',
        '      attributes: []',
        '    },',
        '  ], [],',
        '  (div0, parentContext) => div0Children.call(this, div0, parentContext)',
        ');'
      ]);
      expect(functionsToProcess?.get('div0Children')).toMatchObject({
        fn: { parentNode: 'div0', precode: '' },
        args: ['div0', 'parentContext', 'anchor']
      });
      expectValidJavascript(code);
    });

    it('splits a conditional binding applying structural directives from the one binding the element', async () => {
      const { code } = await run('<div @if (cond()) { title="x" *first } @else { *second }></div>');

      expect(code).toEqual([
        '_renderElement(root, context, null, \'div\', [], [],',
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
        '          conditionalBindings: [],',
        '          directives: [],',
        '        },',
        '        {',
        '          attributes: [],',
        '          events: [],',
        '          conditionalBindings: [],',
        '          directives: [],',
        '        },',
        '      ]',
        '    },',
        '  ], [], [],',
        '  [',
        '    {',
        '      branches: [',
        '        {',
        '          condition: () => this.cond(),',
        '          structuralDirectives: [',
        '            {',
        '              selector: \'first\',',
        '              attributes: []',
        '            },',
        '          ],',
        '          conditionalBindings: [],',
        '        },',
        '        {',
        '          structuralDirectives: [',
        '            {',
        '              selector: \'second\',',
        '              attributes: []',
        '            },',
        '          ],',
        '          conditionalBindings: [],',
        '        },',
        '      ]',
        '    },',
        '  ], null);'
      ]);
      expectValidJavascript(code);
    });

    it('skips the element conditional bindings applying only structural directives, even through nested conditional bindings', async () => {
      const { code } = await run('<div @if (cond()) { *first } @if (other()) { @if (inner()) { *second } }></div>');
      const output = code.join('\n');

      expect(code[0]).toBe('_renderElement(root, context, null, \'div\', [], [], [], [], [],');
      expect(output).toContain('condition: () => this.inner(),');
      expect(output).not.toContain('directives: [');
      expectValidJavascript(code);
    });

    it('generates the nested conditional bindings applying structural directives, skipping the ones applying none', async () => {
      const { code } = await run('<div @switch (mode()) { @case (1) { @if (inner()) { *first } @if (skipped()) { title="x" } } @default { } }></div>');
      const output = code.join('\n');

      expect(output).toContain('expression: () => this.mode(),');
      expect(output).toContain('condition: [1],');
      expect(output).toContain('condition: null,');
      expect(output).toContain('condition: () => this.inner(),');
      expect(output).toContain('structuralDirectives: [],');
      expect(output.match(/condition: \(\) => this\.skipped\(\)/g)).toHaveLength(1);
      expect(output.indexOf('condition: () => this.skipped(),')).toBeLessThan(output.indexOf('structuralDirectives'));
      expectValidJavascript(code);
    });

    it('keeps the svg element factory while the element applying structural directives is created', async () => {
      const { code } = await run('<svg *first><g></g></svg>');

      expect(code[0]).toBe('context.createElement = _createSVGElement;');
      expect(code.at(-1)).toBe('context.createElement = _createElement;');
      expectValidJavascript(code);
    });
  });
});
