import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import { ElementNode } from '../../../parser/types/nodes/element-node.type';
import { ComponentMetadata } from '../../../types/component-metadata/component-metadata.type';
import { DirectiveMetadata } from '../../../types/directive-metadata.type';
import { ComponentPropertyMetadata } from '../../models/component-property-metadata/component-property-metadata.model';
import { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import { Line } from '../../types/generated-line.type';
import { ProcessNode } from '../../types/type-checker-process-node.type';
import { isCustomElementTag, typeCheckElement } from './type-check-element.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as ElementNode;
const processNode: ProcessNode = () => [{ text: 'child;' }];

const metadata = (properties: Record<string, ComponentPropertyMetadata>, events: Record<string, string> = {}) => ({
  type: 'component',
  className: 'MyEl',
  selector: 'my-el',
  properties: new Map(Object.entries(properties)),
  events: new Map(Object.entries(events).map(([name, type]) => [name, { type }]))
}) as unknown as ComponentMetadata;

const directiveMetadata = (properties: Record<string, ComponentPropertyMetadata>, events: Record<string, string> = {}) => ({
  type: 'directive',
  className: 'MyDirective',
  selector: 'myDirective',
  properties: new Map(Object.entries(properties)),
  events: new Map(Object.entries(events).map(([name, type]) => [name, { type }]))
}) as unknown as DirectiveMetadata;

const run = (template: string, ...imports: Array<ComponentMetadata | DirectiveMetadata>): Line[] => {
  const context = new TypeCheckContext();
  context.addImport(...imports);

  return typeCheckElement(parse(template), processNode, context);
};

const text = (lines: Line[]) => lines.map(l => l.text);

describe('typeCheckElement', () => {
  describe('native elements', () => {
    it('ignores literal attributes and processes children', () => {
      expect(text(run('<div class="a"><span></span></div>'))).toEqual(['child;']);
    });

    it('type-checks expression attributes and event handlers', () => {
      const lines = run('<div title="{name}" @click="f($event, b)"></div>');

      expect(text(lines)).toEqual(['root.name;', 'root.f($event, root.b);']);
      expect(lines.every(l => l.mappings?.length)).toBe(true);
    });

    it('type-checks conditional bindings as nested if blocks', () => {
      const lines = run('<div @(cond(), title="{name}" @click="f($event)" @(inner, id="{b}"))></div>');

      expect(text(lines)).toEqual([
        'if (root.cond()) {',
        '  root.name;',
        '  root.f($event);',
        '  if (root.inner) {',
        '    root.b;',
        '  }',
        '}'
      ]);
      expect(lines[0].mappings).toHaveLength(1);
    });
  });

  describe('custom elements', () => {
    const properties = {
      title: new ComponentPropertyMetadata('title', 'string'),
      label: new ComponentPropertyMetadata('label', 'string')
    };

    it('type-checks literal and expression bindings, ignoring unknown attributes', () => {
      const lines = run('<my-el title="{name}" label="x" other="y"></my-el>', metadata(properties));

      expect(text(lines)).toEqual([
        '{',
        '  (root.name) satisfies string;',
        '}',
        '{',
        '  let x!: string;',
        '  x satisfies string;',
        '}'
      ]);
    });

    it('type-checks events with and without a payload', () => {
      const component = metadata(properties, { done: 'number', ping: 'void' });
      const output = text(run('<my-el title="a" label="b" @done="f($event)" @ping="g()"></my-el>', component)).join('\n');

      expect(output).toContain('let $event!: CustomEvent<number>;');
      expect(output).toContain('root.f($event);');
      expect(output).toContain('root.g();');
      expect(output.match(/CustomEvent/g)).toHaveLength(1);
    });

    it('throws when the selector is not imported', () => {
      expect(() => run('<my-el></my-el>')).toThrow('my-el selector is not associated to any WebComponent imported in the template');
    });

    it('throws when required properties are missing', () => {
      const component = metadata({ title: new ComponentPropertyMetadata('title', 'string', { required: true }) });
      expect(() => run('<my-el></my-el>', component)).toThrow('my-el is missing the following required properties:\n ● title');
    });

    it('accepts required properties that are provided', () => {
      const component = metadata({ title: new ComponentPropertyMetadata('title', 'string', { required: true }) });
      expect(run('<my-el title="a"></my-el>', component)).not.toHaveLength(0);
    });

    it('throws for an unknown event', () => {
      expect(() => run('<my-el @nope="f()"></my-el>', metadata({}))).toThrow('Unknown event "nope" on <my-el> (MyEl has no @Event with this name).');
    });

    it('type-checks inputs and outputs inside conditional bindings', () => {
      const component = metadata(properties, { done: 'number' });
      const lines = run('<my-el @(cond, title="{name}" @done="f($event)" @(inner, label="x"))></my-el>', component);

      expect(text(lines)).toEqual([
        'if (root.cond) {',
        '  {',
        '    (root.name) satisfies string;',
        '  }',
        '  {',
        '    let $event!: CustomEvent<number>;',
        '    root.f($event);',
        '  }',
        '  if (root.inner) {',
        '    {',
        '      let x!: string;',
        '      x satisfies string;',
        '    }',
        '  }',
        '}'
      ]);
    });

    it('throws for an unknown event inside a conditional binding', () => {
      expect(() => run('<my-el @(cond, @nope="f()")></my-el>', metadata({}))).toThrow('Unknown event "nope" on <my-el> (MyEl has no @Event with this name).');
    });

    it('throws when a required property is bound inside a conditional binding', () => {
      const component = metadata({ title: new ComponentPropertyMetadata('title', 'string', { required: true }) });
      expect(() => run('<my-el @(cond, title="b")></my-el>', component)).toThrow('Required property "title" of <my-el> cannot be bound inside a conditional binding.');
    });
  });
});

describe('typeCheckElement directives', () => {
  const properties = {
    display: new ComponentPropertyMetadata('display', '\'block\' | \'none\''),
    visible: new ComponentPropertyMetadata('visible', 'boolean', { required: true })
  };

  it('type-checks directive properties and events on a native element', () => {
    const directive = directiveMetadata(properties, { toggled: 'boolean' });
    const lines = run('<div title="{name}" @@myDirective(display="block" visible="{isVisible()}" @toggled="f($event)")><span></span></div>', directive);

    expect(text(lines)).toEqual([
      'root.name;',
      '{',
      '  let x!: string;',
      '  x satisfies \'block\' | \'none\';',
      '}',
      '{',
      '  (root.isVisible()) satisfies boolean;',
      '}',
      '{',
      '  let $event!: CustomEvent<boolean>;',
      '  root.f($event);',
      '}',
      'child;'
    ]);
  });

  it('type-checks the directives of a custom element after its own bindings', () => {
    const component = metadata({ title: new ComponentPropertyMetadata('title', 'string') });
    const directive = directiveMetadata({ display: properties.display });
    const lines = run('<my-el title="{name}" @@myDirective(display="{mode}")></my-el>', component, directive);

    expect(text(lines)).toEqual([
      '{',
      '  (root.name) satisfies string;',
      '}',
      '{',
      '  (root.mode) satisfies \'block\' | \'none\';',
      '}'
    ]);
  });

  it('accepts a directive declared without bindings', () => {
    expect(text(run('<div @@myDirective></div>', directiveMetadata({})))).toEqual([]);
  });

  it('throws when the directive is not imported', () => {
    expect(() => run('<div @@myDirective></div>')).toThrow('@@myDirective selector is not associated to any Directive imported in the template');
  });

  it('does not resolve a directive through a component sharing its selector', () => {
    const component = { ...metadata({}), selector: 'myDirective' } as ComponentMetadata;
    expect(() => run('<div @@myDirective></div>', component)).toThrow('@@myDirective selector is not associated to any Directive imported in the template');
  });

  it('throws for an unknown property', () => {
    expect(() => run('<div @@myDirective(other="x")></div>', directiveMetadata({}))).toThrow('Unknown property "other" on @@myDirective (MyDirective has no @Property with this name).');
  });

  it('throws when required properties are missing', () => {
    expect(() => run('<div @@myDirective(display="block")></div>', directiveMetadata(properties))).toThrow('@@myDirective on <div> is missing the following required properties:\n ● visible');
  });

  it('throws for an unknown event', () => {
    expect(() => run('<div @@myDirective(@nope="f()")></div>', directiveMetadata({}))).toThrow('Unknown event "nope" on @@myDirective (MyDirective has no @Event with this name).');
  });

  it('type-checks the conditional bindings of a directive as nested if blocks', () => {
    const directive = directiveMetadata(properties, { toggled: 'void' });
    const lines = run('<div @@myDirective(visible="{isVisible()}" @(cond(), display="{mode}" @(inner, @toggled="f()")))></div>', directive);

    expect(text(lines)).toEqual([
      '{',
      '  (root.isVisible()) satisfies boolean;',
      '}',
      'if (root.cond()) {',
      '  {',
      '    (root.mode) satisfies \'block\' | \'none\';',
      '  }',
      '  if (root.inner) {',
      '    {',
      '      root.f();',
      '    }',
      '  }',
      '}'
    ]);
  });

  it('throws for an unknown property inside a conditional binding of a directive', () => {
    expect(() => run('<div @@myDirective(@(cond(), other="x"))></div>', directiveMetadata({}))).toThrow('Unknown property "other" on @@myDirective (MyDirective has no @Property with this name).');
  });

  it('throws for an unknown event inside a conditional binding of a directive', () => {
    expect(() => run('<div @@myDirective(@(cond(), @nope="f()"))></div>', directiveMetadata({}))).toThrow('Unknown event "nope" on @@myDirective (MyDirective has no @Event with this name).');
  });

  it('throws when a required property of a directive is bound inside a conditional binding', () => {
    expect(() => run('<div @@myDirective(@(cond(), visible="{isVisible()}"))></div>', directiveMetadata(properties))).toThrow('Required property "visible" of @@myDirective cannot be bound inside a conditional binding.');
  });

  it('type-checks the directives applied inside a conditional binding of a native element', () => {
    const lines = run('<div @(cond(), title="{name}" @@myDirective(display="{mode}"))></div>', directiveMetadata({ display: properties.display }));

    expect(text(lines)).toEqual([
      'if (root.cond()) {',
      '  root.name;',
      '  {',
      '    (root.mode) satisfies \'block\' | \'none\';',
      '  }',
      '}'
    ]);
  });

  it('type-checks the directives applied inside a conditional binding of a custom element', () => {
    const component = metadata({ title: new ComponentPropertyMetadata('title', 'string') });
    const lines = run('<my-el @(cond(), @(inner, @@myDirective(display="{mode}")))></my-el>', component, directiveMetadata({ display: properties.display }));

    expect(text(lines)).toEqual([
      'if (root.cond()) {',
      '  if (root.inner) {',
      '    {',
      '      (root.mode) satisfies \'block\' | \'none\';',
      '    }',
      '  }',
      '}'
    ]);
  });

  it('throws when a directive applied inside a conditional binding is not imported', () => {
    expect(() => run('<div @(cond(), @@myDirective)></div>')).toThrow('@@myDirective selector is not associated to any Directive imported in the template');
  });
});

describe('isCustomElementTag', () => {
  it.each([
    ['my-el', true],
    ['x-a.b_c', true],
    ['div', false],
    ['My-el', false],
    ['-el', false]
  ])('classifies %s', (tag, expected) => {
    expect(isCustomElementTag(tag)).toBe(expected);
  });
});
