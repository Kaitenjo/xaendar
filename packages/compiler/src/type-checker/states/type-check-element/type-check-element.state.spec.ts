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
      const lines = run('<div title="{name}" (click)="f($event, b)"></div>');

      expect(text(lines)).toEqual(['root.name;', 'root.f($event, root.b);']);
      expect(lines.every(l => l.mappings?.length)).toBe(true);
    });

    it('type-checks conditional bindings as nested if blocks', () => {
      const lines = run('<div @if (cond()) { title="{name}" (click)="f($event)" @if (inner) { id="{b}" } }></div>');

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

    it('type-checks an @if chain as an if / else if / else chain, mapping each condition to its branch', () => {
      const template = '<div @if (a()) { title="{x}" } @else if (b) { title="{y}" } @else { (click)="f()" }></div>';
      const lines = run(template);

      expect(text(lines)).toEqual([
        'if (root.a()) {',
        '  root.x;',
        '}',
        'else if (root.b) {',
        '  root.y;',
        '}',
        'else {',
        '  root.f();',
        '}'
      ]);
      expect(lines[0].mappings).toEqual([{ columnStart: 4, columnEnd: 12, original: { start: template.indexOf('@if'), end: template.indexOf('}"') + 4 } }]);
      expect(lines[3].mappings).toEqual([{ columnStart: 9, columnEnd: 15, original: { start: template.indexOf('@else if'), end: template.indexOf(' @else {') } }]);
      expect(lines[6].mappings).toBeUndefined();
    });

    it('type-checks a @switch as a switch statement, stacking the cases sharing a branch', () => {
      const template = '<div @switch (mode()) { @case (\'a\') @case (\'b\') { title="{x}" } @case (1) { } @default { @if (inner) { id="{y}" } } }></div>';
      const lines = run(template);

      expect(text(lines)).toEqual([
        'switch (root.mode()) {',
        '  case \'a\':',
        '  case \'b\':',
        '    root.x;',
        '    break;',
        '  case 1:',
        '    break;',
        '  default:',
        '    if (root.inner) {',
        '      root.y;',
        '    }',
        '    break;',
        '}'
      ]);
      expect(lines[0].mappings).toEqual([{ columnStart: 8, columnEnd: 19, original: { start: template.indexOf('@switch'), end: template.lastIndexOf('}') + 1 } }]);
    });

    it('type-checks a @switch without branches', () => {
      expect(text(run('<div @switch (mode()) { }></div>'))).toEqual(['switch (root.mode()) {', '}']);
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
      const output = text(run('<my-el title="a" label="b" (done)="f($event)" (ping)="g()"></my-el>', component)).join('\n');

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
      expect(() => run('<my-el (nope)="f()"></my-el>', metadata({}))).toThrow('Unknown event "nope" on <my-el> (MyEl has no @Event with this name).');
    });

    it('type-checks inputs and outputs inside conditional bindings', () => {
      const component = metadata(properties, { done: 'number' });
      const lines = run('<my-el @if (cond) { title="{name}" (done)="f($event)" @if (inner) { label="x" } } @else { label="{other}" }></my-el>', component);

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
        '}',
        'else {',
        '  {',
        '    (root.other) satisfies string;',
        '  }',
        '}'
      ]);
    });

    it('type-checks inputs and outputs inside the branches of a @switch', () => {
      const component = metadata(properties, { done: 'void' });
      const lines = run('<my-el @switch (mode) { @case (1) { title="{name}" } @default { (done)="f()" } }></my-el>', component);

      expect(text(lines)).toEqual([
        'switch (root.mode) {',
        '  case 1:',
        '    {',
        '      (root.name) satisfies string;',
        '    }',
        '    break;',
        '  default:',
        '    {',
        '      root.f();',
        '    }',
        '    break;',
        '}'
      ]);
    });

    it.each([
      ['an @if branch', '<my-el @if (cond) { (nope)="f()" }></my-el>'],
      ['an @else branch', '<my-el @if (cond) { } @else { (nope)="f()" }></my-el>'],
      ['a @switch branch', '<my-el @switch (mode) { @case (1) { (nope)="f()" } }></my-el>']
    ])('throws for an unknown event inside %s', (_description, template) => {
      expect(() => run(template, metadata({}))).toThrow('Unknown event "nope" on <my-el> (MyEl has no @Event with this name).');
    });

    describe('required properties bound inside conditional bindings', () => {
      const component = metadata({
        title: new ComponentPropertyMetadata('title', 'string', { required: true }),
        label: new ComponentPropertyMetadata('label', 'string')
      }, { done: 'void' });
      const notAlwaysBound = 'Required property "title" of <my-el> must always be bound: bind it in every branch of its conditional binding, including an @else or @default one, or outside of it.';

      it.each([
        ['both branches of an @if closed by an @else', '<my-el @if (cond) { title="b" } @else { title="c" }></my-el>'],
        ['every branch of an @if chain closed by an @else', '<my-el @if (a) { title="b" } @else if (b) { title="c" } @else if (c) { title="d" } @else { title="e" }></my-el>'],
        ['every branch of a @switch closed by a @default', '<my-el @switch (mode) { @case (1) @case (2) { title="b" } @case (3) { title="c" } @default { title="d" } }></my-el>'],
        ['the only branch of a @switch, its @default', '<my-el @switch (mode) { @default { title="b" } }></my-el>'],
        ['a conditional binding nested in a branch, which always binds it in turn', '<my-el @if (a) { @if (b) { title="b" } @else { title="c" } } @else { title="d" }></my-el>'],
        ['conditional bindings nested in every branch, which always bind it in turn', '<my-el @if (a) { @switch (mode) { @default { title="b" } } } @else { @if (b) { title="c" } @else { title="d" } }></my-el>'],
        ['every branch, next to other bindings', '<my-el @if (cond) { title="b" label="x" (done)="f()" } @else { title="c" }></my-el>'],
        ['every branch of the second conditional binding', '<my-el @if (cond) { label="x" } @if (other) { title="b" } @else { title="c" }></my-el>']
      ])('accepts a required property bound in %s', (_description, template) => {
        expect(() => run(template, component)).not.toThrow();
      });

      it('type-checks the value a required property is bound to in each branch', () => {
        const lines = run('<my-el @if (cond) { title="{name}" } @else { title="c" }></my-el>', component);

        expect(text(lines)).toEqual([
          'if (root.cond) {',
          '  {',
          '    (root.name) satisfies string;',
          '  }',
          '}',
          'else {',
          '  {',
          '    let x!: string;',
          '    x satisfies string;',
          '  }',
          '}'
        ]);
      });

      it.each([
        ['an @if without an @else', '<my-el @if (cond) { title="b" }></my-el>'],
        ['every branch of an @if chain without an @else', '<my-el @if (a) { title="b" } @else if (b) { title="c" }></my-el>'],
        ['the @if branch but not in the @else one', '<my-el @if (cond) { title="b" } @else { label="x" }></my-el>'],
        ['the @else branch but not in the @if one', '<my-el @if (cond) { label="x" } @else { title="b" }></my-el>'],
        ['all but one branch of an @if chain', '<my-el @if (a) { title="b" } @else if (b) { } @else { title="c" }></my-el>'],
        ['every branch of a @switch without a @default', '<my-el @switch (mode) { @case (1) { title="b" } @case (2) { title="c" } }></my-el>'],
        ['the @case branches but not in the @default one', '<my-el @switch (mode) { @case (1) { title="b" } @default { } }></my-el>'],
        ['the @default branch but not in a @case one', '<my-el @switch (mode) { @case (1) { } @default { title="b" } }></my-el>'],
        ['a nested conditional binding without an @else', '<my-el @if (a) { @if (b) { title="b" } } @else { title="c" }></my-el>'],
        ['a nested conditional binding not binding it in every branch', '<my-el @if (a) { @if (b) { title="b" } @else { label="x" } } @else { title="c" }></my-el>'],
        ['every branch of a nested conditional binding, itself in an @if without an @else', '<my-el @if (a) { @if (b) { title="b" } @else { title="c" } }></my-el>']
      ])('throws when a required property is bound in %s', (_description, template) => {
        expect(() => run(template, component)).toThrow(notAlwaysBound);
      });

      it('reports the binding of the required property that is not always bound', () => {
        const template = '<my-el @if (cond) { label="x" title="b" } @else { label="y" }></my-el>';
        let caught: unknown;

        try {
          run(template, component);
        } catch (err) {
          caught = err;
        }

        expect(caught).toMatchObject({ message: notAlwaysBound, cause: { start: template.indexOf('title="b"'), end: template.indexOf('title="b"') + 'title="b"'.length } });
      });

      it.each([
        ['binds another property in every branch', '<my-el @if (cond) { label="x" } @else { label="y" }></my-el>'],
        ['has no branch', '<my-el @switch (mode) { }></my-el>']
      ])('still reports as missing a required property when the only conditional binding %s', (_description, template) => {
        expect(() => run(template, component)).toThrow('my-el is missing the following required properties:\n ● title');
      });

      it('reports as missing only the required properties that are not always bound', () => {
        const properties = {
          title: new ComponentPropertyMetadata('title', 'string', { required: true }),
          label: new ComponentPropertyMetadata('label', 'string', { required: true }),
          other: new ComponentPropertyMetadata('other', 'string', { required: true })
        };
        const template = '<my-el label="x" @if (cond) { title="b" } @else { title="c" }></my-el>';

        expect(() => run(template, metadata(properties))).toThrow(/^my-el is missing the following required properties:\n ● other$/);
      });
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
    const lines = run('<div title="{name}" @@myDirective(display="block" visible="{isVisible()}" (toggled)="f($event)")><span></span></div>', directive);

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
    expect(() => run('<div @@myDirective((nope)="f()")></div>', directiveMetadata({}))).toThrow('Unknown event "nope" on @@myDirective (MyDirective has no @Event with this name).');
  });

  it('type-checks the conditional bindings of a directive as nested if blocks', () => {
    const directive = directiveMetadata(properties, { toggled: 'void' });
    const lines = run('<div @@myDirective(visible="{isVisible()}" @if (cond()) { display="{mode}" @if (inner) { (toggled)="f()" } } @else { display="none" })></div>', directive);

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
      '}',
      'else {',
      '  {',
      '    let x!: string;',
      '    x satisfies \'block\' | \'none\';',
      '  }',
      '}'
    ]);
  });

  it('type-checks a @switch declared in a directive as a switch statement', () => {
    const directive = directiveMetadata({ display: properties.display }, { toggled: 'void' });
    const lines = run('<div @@myDirective(@switch (kind) { @case (1) { display="{mode}" } @default { (toggled)="f()" } })></div>', directive);

    expect(text(lines)).toEqual([
      'switch (root.kind) {',
      '  case 1:',
      '    {',
      '      (root.mode) satisfies \'block\' | \'none\';',
      '    }',
      '    break;',
      '  default:',
      '    {',
      '      root.f();',
      '    }',
      '    break;',
      '}'
    ]);
  });

  it.each([
    ['an @if branch', '<div @@myDirective(@if (cond()) { other="x" })></div>'],
    ['an @else branch', '<div @@myDirective(@if (cond()) { } @else { other="x" })></div>'],
    ['a @switch branch', '<div @@myDirective(@switch (kind) { @default { other="x" } })></div>']
  ])('throws for an unknown property inside %s of a conditional binding of a directive', (_description, template) => {
    expect(() => run(template, directiveMetadata({}))).toThrow('Unknown property "other" on @@myDirective (MyDirective has no @Property with this name).');
  });

  it('throws for an unknown event inside a conditional binding of a directive', () => {
    expect(() => run('<div @@myDirective(@if (cond()) { (nope)="f()" })></div>', directiveMetadata({}))).toThrow('Unknown event "nope" on @@myDirective (MyDirective has no @Event with this name).');
  });

  describe('required properties bound inside conditional bindings', () => {
    const notAlwaysBound = 'Required property "visible" of @@myDirective must always be bound: bind it in every branch of its conditional binding, including an @else or @default one, or outside of it.';

    it.each([
      ['both branches of an @if closed by an @else', '<div @@myDirective(@if (cond()) { visible="{isVisible()}" } @else { visible="{isHidden()}" })></div>'],
      ['every branch of a @switch closed by a @default', '<div @@myDirective(@switch (kind) { @case (1) { visible="{isVisible()}" } @default { visible="{isHidden()}" } })></div>'],
      ['a conditional binding nested in a branch, which always binds it in turn', '<div @@myDirective(@if (cond()) { @if (inner) { visible="{a}" } @else { visible="{b}" } } @else { visible="{c}" display="none" })></div>'],
      ['every branch of its own conditional binding, when the directive is applied by a branch of the element', '<div @if (cond()) { @@myDirective(@if (inner) { visible="{a}" } @else { visible="{b}" }) }></div>']
    ])('accepts a required property of a directive bound in %s', (_description, template) => {
      expect(() => run(template, directiveMetadata(properties))).not.toThrow();
    });

    it('type-checks the value a required property of a directive is bound to in each branch', () => {
      const lines = run('<div @@myDirective(@if (cond()) { visible="{isVisible()}" } @else { visible="{isHidden()}" })></div>', directiveMetadata(properties));

      expect(text(lines)).toEqual([
        'if (root.cond()) {',
        '  {',
        '    (root.isVisible()) satisfies boolean;',
        '  }',
        '}',
        'else {',
        '  {',
        '    (root.isHidden()) satisfies boolean;',
        '  }',
        '}'
      ]);
    });

    it.each([
      ['an @if without an @else', '<div @@myDirective(@if (cond()) { visible="{isVisible()}" })></div>'],
      ['the @if branch but not in the @else one', '<div @@myDirective(@if (cond()) { visible="{isVisible()}" } @else { display="none" })></div>'],
      ['every branch of a @switch without a @default', '<div @@myDirective(@switch (kind) { @case (1) { visible="{isVisible()}" } @case (2) { visible="{isHidden()}" } })></div>'],
      ['a nested conditional binding without an @else', '<div @@myDirective(@if (cond()) { @if (inner) { visible="{a}" } } @else { visible="{b}" })></div>']
    ])('throws when a required property of a directive is bound in %s', (_description, template) => {
      expect(() => run(template, directiveMetadata(properties))).toThrow(notAlwaysBound);
    });

    it('reports the binding of the required property of a directive that is not always bound', () => {
      const template = '<div @@myDirective(@if (cond()) { display="block" visible="{isVisible()}" })></div>';
      let caught: unknown;

      try {
        run(template, directiveMetadata(properties));
      } catch (err) {
        caught = err;
      }

      expect(caught).toMatchObject({ message: notAlwaysBound, cause: { start: template.indexOf('visible='), end: template.indexOf(' })') } });
    });

    it('still reports as missing a required property of a directive no conditional binding binds', () => {
      const template = '<div @@myDirective(@if (cond()) { display="block" } @else { display="none" })></div>';
      expect(() => run(template, directiveMetadata(properties))).toThrow('@@myDirective on <div> is missing the following required properties:\n ● visible');
    });
  });

  it('type-checks the directives applied inside a conditional binding of a native element', () => {
    const lines = run('<div @if (cond()) { title="{name}" @@myDirective(display="{mode}") } @else { @@myDirective(display="none") }></div>', directiveMetadata({ display: properties.display }));

    expect(text(lines)).toEqual([
      'if (root.cond()) {',
      '  root.name;',
      '  {',
      '    (root.mode) satisfies \'block\' | \'none\';',
      '  }',
      '}',
      'else {',
      '  {',
      '    let x!: string;',
      '    x satisfies \'block\' | \'none\';',
      '  }',
      '}'
    ]);
  });

  it('type-checks the directives applied inside a conditional binding of a custom element', () => {
    const component = metadata({ title: new ComponentPropertyMetadata('title', 'string') });
    const lines = run('<my-el @if (cond()) { @if (inner) { @@myDirective(display="{mode}") } }></my-el>', component, directiveMetadata({ display: properties.display }));

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
    expect(() => run('<div @if (cond()) { @@myDirective }></div>')).toThrow('@@myDirective selector is not associated to any Directive imported in the template');
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
