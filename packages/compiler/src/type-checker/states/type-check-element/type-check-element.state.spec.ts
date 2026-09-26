import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import { ElementNode } from '../../../parser/types/nodes/element-node.type';
import { ComponentMetadata } from '../../../types/component-metadata/component-metadata.type';
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
  selectors: ['my-el'],
  properties: new Map(Object.entries(properties)),
  events: new Map(Object.entries(events).map(([name, type]) => [name, { type }]))
}) as unknown as ComponentMetadata;

const run = (template: string, component?: ComponentMetadata): Line[] => {
  const context = new TypeCheckContext();
  if (component) {
    context.addImport(component);
  }

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
