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

    it('type-checks expression attributes and event handlers, declaring $event with the type of the native event in the block of the handler', () => {
      const template = '<div title="{heading}" (click)="f($event, b)"></div>';
      const lines = run(template);

      expect(text(lines)).toEqual([
        'root.heading;',
        '{',
        '  let $event!: HTMLElementEventMap[\'click\'];',
        '  root.f($event, root.b);',
        '}'
      ]);
      expect(lines[0].mappings![0]).toBeDefined();
      expect(lines[3].mappings![0]).toEqual({ columnStart: 2, columnEnd: 25, original: { start: template.indexOf('(click)'), end: template.indexOf('></div>') } });
      // The declaration of $event is mapped too, so that an event the element doesn't dispatch is reported on the binding
      expect(lines[2].mappings![0]).toEqual({ columnStart: 2, columnEnd: 44, original: { start: template.indexOf('(click)'), end: template.indexOf('></div>') } });
      expect([lines[1], lines[4]].every(l => !l.mappings)).toBe(true);
    });

    it('type-checks the expressions toggling classes, of any type, on the element and in its conditional bindings', () => {
      const template = '<div [class.on]="{active()}" @if (cond()) { [class.big]="{items.length}" }></div>';
      const lines = run(template);

      expect(text(lines)).toEqual([
        'root.active();',
        'if (root.cond()) {',
        '  root.items.length;',
        '}'
      ]);
      expect(lines[0].mappings![0]).toBeDefined();
    });

    it('declares $event in a separate block for each event, so that every handler gets its own', () => {
      expect(text(run('<div (click)="f($event)" (input)="g($event)"></div>'))).toEqual([
        '{',
        '  let $event!: HTMLElementEventMap[\'click\'];',
        '  root.f($event);',
        '}',
        '{',
        '  let $event!: HTMLElementEventMap[\'input\'];',
        '  root.g($event);',
        '}'
      ]);
    });

    it('emits the call to a handler not passed $event without a block declaring it', () => {
      const template = '<div (click)="f($eventName, obj.$event, \'$event\')"></div>';
      const lines = run(template);

      expect(text(lines)).toEqual(['root.f(root.$eventName, root.obj.$event, \'$event\');']);
      expect(lines[0].mappings![0]).toEqual({ columnStart: 0, columnEnd: 51, original: { start: template.indexOf('(click)'), end: template.indexOf('></div>') } });
    });

    it('leaves $event undeclared when only a member of it is passed, since it must be passed whole', () => {
      expect(text(run('<div (click)="f($event.target)"></div>'))).toEqual(['root.f($event.target);']);
    });

    it.each(['$', '$e', '$ev', '$even'])('declares $event while its beginning %s is being written, so that it is proposed', beginning => {
      expect(text(run(`<div (click)="f(${beginning})"></div>`))).toEqual([
        '{',
        '  let $event!: HTMLElementEventMap[\'click\'];',
        `  root.f(${beginning});`,
        '}'
      ]);
    });

    it('does not declare $event for a name that merely starts like it', () => {
      expect(text(run('<div (click)="f($eventual)"></div>'))).toEqual(['root.f(root.$eventual);']);
      expect(text(run('<div (click)="f(event)"></div>'))).toEqual(['root.f(event);']);
    });

    it('calls a handler on a variable of the template as written, as the generated code does, and any other one on the component', () => {
      const context = new TypeCheckContext();
      context.addUnresolvableIdentifier('item', 'signal');

      expect(text(typeCheckElement(parse('<div (click)="item.set(1)" (input)="items.clear()"></div>'), processNode, context))).toEqual(['item.set(1);', 'root.items.clear();']);
    });

    it('type-checks conditional bindings as nested if blocks', () => {
      const lines = run('<div @if (cond()) { title="{heading}" (click)="f($event)" @if (inner) { id="{b}" } }></div>');

      expect(text(lines)).toEqual([
        'if (root.cond()) {',
        '  root.heading;',
        '  {',
        '    let $event!: HTMLElementEventMap[\'click\'];',
        '    root.f($event);',
        '  }',
        '  if (root.inner) {',
        '    root.b;',
        '  }',
        '}'
      ]);
      expect(lines[0].mappings![0]).toBeDefined();
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
      expect(lines[0].mappings![0]).toEqual({ columnStart: 4, columnEnd: 12, original: { start: template.indexOf('@if'), end: template.indexOf('}"') + 4 } });
      expect(lines[3].mappings![0]).toEqual({ columnStart: 9, columnEnd: 15, original: { start: template.indexOf('@else if'), end: template.indexOf(' @else {') } });
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
      expect(lines[0].mappings![0]).toEqual({ columnStart: 8, columnEnd: 19, original: { start: template.indexOf('@switch'), end: template.lastIndexOf('}') + 1 } });
    });

    it('type-checks a @switch without branches', () => {
      expect(text(run('<div @switch (mode()) { }></div>'))).toEqual(['switch (root.mode()) {', '}']);
    });

    describe('event maps', () => {
      const processChild: ProcessNode = (child, context) => typeCheckElement(child as ElementNode, processChild, context);
      const runTree = (template: string) => text(typeCheckElement(parse(template), processChild, new TypeCheckContext()));

      it('types the events of an <svg> and of its descendants through SVGElementEventMap', () => {
        expect(runTree('<svg (click)="f($event)"><g><circle @if (cond) { (click)="g($event)" }></circle></g></svg>')).toEqual([
          '{',
          '  let $event!: SVGElementEventMap[\'click\'];',
          '  root.f($event);',
          '}',
          'if (root.cond) {',
          '  {',
          '    let $event!: SVGElementEventMap[\'click\'];',
          '    root.g($event);',
          '  }',
          '}'
        ]);
      });

      it('types the events of a <math> and of its descendants through MathMLElementEventMap', () => {
        expect(runTree('<math><mi (click)="f($event)"></mi></math>')).toEqual([
          '{',
          '  let $event!: MathMLElementEventMap[\'click\'];',
          '  root.f($event);',
          '}'
        ]);
      });

      it('types the events of a <foreignObject> through SVGElementEventMap, and of its descendants through HTMLElementEventMap', () => {
        expect(runTree('<svg><foreignObject (click)="f($event)"><div><button (click)="g($event)"></button></div></foreignObject></svg>')).toEqual([
          '{',
          '  let $event!: SVGElementEventMap[\'click\'];',
          '  root.f($event);',
          '}',
          '{',
          '  let $event!: HTMLElementEventMap[\'click\'];',
          '  root.g($event);',
          '}'
        ]);
      });

      it('types the events of the siblings of an <svg> through HTMLElementEventMap', () => {
        expect(runTree('<div><svg><svg></svg></svg><span (click)="f($event)"></span></div>')).toEqual([
          '{',
          '  let $event!: HTMLElementEventMap[\'click\'];',
          '  root.f($event);',
          '}'
        ]);
      });
    });
  });

  describe('custom elements', () => {
    const properties = {
      title: new ComponentPropertyMetadata('title', 'string'),
      label: new ComponentPropertyMetadata('label', 'string')
    };

    it('type-checks literal and expression bindings, ignoring unknown attributes', () => {
      const lines = run('<my-el title="{heading}" label="x" other="y"></my-el>', metadata(properties));

      expect(text(lines)).toEqual([
        '{',
        '  (root.heading) satisfies string;',
        '}',
        '{',
        '  let x!: string;',
        '  x satisfies string;',
        '}'
      ]);
    });

    it('type-checks the expressions toggling classes on the element of a component, without matching them to its properties', () => {
      const lines = run('<my-el [class.title]="{active()}" @if (cond()) { [class.label]="{1}" }></my-el>', metadata(properties));

      expect(text(lines)).toEqual([
        'root.active();',
        'if (root.cond()) {',
        '  1;',
        '}'
      ]);
    });

    it('declares $event only for the events whose handler is passed it, with a null detail for the events without payload', () => {
      const component = metadata({}, { done: 'number', changed: 'string', ping: 'void' });
      const lines = run('<my-el (done)="f($event)" (changed)="g()" (ping)="h()" (ping)="i($event)"></my-el>', component);

      expect(text(lines)).toEqual([
        '{',
        '  let $event!: CustomEvent<number>;',
        '  root.f($event);',
        '}',
        'root.g();',
        'root.h();',
        '{',
        '  let $event!: CustomEvent<null>;',
        '  root.i($event);',
        '}'
      ]);
      expect(lines[2].mappings![0]).toBeDefined();
      expect(lines[4].mappings![0]).toBeDefined();
    });

    it('throws when the selector is not imported', () => {
      expect(() => run('<my-el></my-el>')).toThrow('my-el selector is not associated to any WebComponent imported in the template');
    });

    it('throws when a property is bound without a value, which is only valid on a native attribute', () => {
      expect(() => run('<my-el label></my-el>', metadata(properties))).toThrow('Property "label" needs a value: write label="…" or label="{ expression }". An attribute without a value is only valid on a native element.');
      expect(() => run('<my-el title="x" label />', metadata(properties))).toThrow('Property "label" needs a value');
      expect(() => run('<my-el other></my-el>', metadata(properties))).not.toThrow();
      expect(() => run('<my-el label="true"></my-el>', metadata(properties))).not.toThrow();
    });

    it('throws when required properties are missing', () => {
      const component = metadata({ title: new ComponentPropertyMetadata('title', 'string', { required: true }) });
      expect(() => run('<my-el></my-el>', component)).toThrow('my-el is missing the following required properties:\n ● title');
    });

    it('accepts required properties that are provided', () => {
      const component = metadata({ title: new ComponentPropertyMetadata('title', 'string', { required: true }) });
      expect(run('<my-el title="a"></my-el>', component)).not.toHaveLength(0);
    });

    it('types the events the component does not declare as native events of its element, checking their name even without $event', () => {
      expect(text(run('<my-el (click)="f($event)" (nope)="g()"></my-el>', metadata({})))).toEqual([
        '{',
        '  let $event!: HTMLElementEventMap[\'click\'];',
        '  root.f($event);',
        '}',
        'null! satisfies HTMLElementEventMap[\x27nope\x27];',
        'root.g();'
      ]);
    });

    it('type-checks inputs and outputs inside conditional bindings', () => {
      const component = metadata(properties, { done: 'number' });
      const lines = run('<my-el @if (cond) { title="{heading}" (done)="f($event)" @if (inner) { label="x" } } @else { label="{other}" }></my-el>', component);

      expect(text(lines)).toEqual([
        'if (root.cond) {',
        '  {',
        '    (root.heading) satisfies string;',
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
      const lines = run('<my-el @switch (mode) { @case (1) { title="{heading}" } @default { (done)="f()" } }></my-el>', component);

      expect(text(lines)).toEqual([
        'switch (root.mode) {',
        '  case 1:',
        '    {',
        '      (root.heading) satisfies string;',
        '    }',
        '    break;',
        '  default:',
        '    root.f();',
        '    break;',
        '}'
      ]);
    });

    it('types the native events bound inside a conditional binding through the event map of the element', () => {
      expect(text(run('<my-el @if (cond) { (click)="f($event)" }></my-el>', metadata({})))).toEqual([
        'if (root.cond) {',
        '  {',
        '    let $event!: HTMLElementEventMap[\'click\'];',
        '    root.f($event);',
        '  }',
        '}'
      ]);
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
        const lines = run('<my-el @if (cond) { title="{heading}" } @else { title="c" }></my-el>', component);

        expect(text(lines)).toEqual([
          'if (root.cond) {',
          '  {',
          '    (root.heading) satisfies string;',
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

  describe('custom elements of other libraries', () => {
    const runForeign = (template: string, ...imports: Array<ComponentMetadata | DirectiveMetadata>): Line[] => {
      const context = new TypeCheckContext();
      context.addImport(...imports);
      context.addCustomElementPatterns('sl-*', 'my-el');

      return typeCheckElement(parse(template), processNode, context);
    };

    it('checks the expressions of the attributes, typing $event through the event map or as any', () => {
      const lines = runForeign('<sl-button variant="primary" size="{size}" @if (cond) { (sl-focus)="g($event)" } (click)="f($event)"></sl-button>');

      expect(text(lines)).toEqual([
        'root.size;',
        '{',
        '  let $event!: (HTMLElementEventMap extends { \'click\': infer Event } ? Event : any);',
        '  root.f($event);',
        '}',
        'if (root.cond) {',
        '  {',
        '    let $event!: (HTMLElementEventMap extends { \'sl-focus\': infer Event } ? Event : any);',
        '    root.g($event);',
        '  }',
        '}'
      ]);
    });

    it('types the native events of the directives applied to them the same way', () => {
      const lines = runForeign('<sl-button @@myDirective((sl-blur)="f($event)")></sl-button>', directiveMetadata({}));

      expect(text(lines)).toEqual([
        '{',
        '  let $event!: (HTMLElementEventMap extends { \'sl-blur\': infer Event } ? Event : any);',
        '  root.f($event);',
        '}'
      ]);
    });

    it('throws for a tag both imported as a component and matching a pattern', () => {
      expect(() => runForeign('<my-el></my-el>', metadata({}))).toThrow('my-el is both imported as a WebComponent and declared in customElements');
    });

    it('throws for a tag neither imported nor matching a pattern', () => {
      expect(() => runForeign('<x-thing></x-thing>')).toThrow('x-thing selector is not associated to any WebComponent imported in the template, nor declared in customElements');
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
    const lines = run('<div title="{heading}" @@myDirective(display="block" visible="{isVisible()}" (toggled)="f($event)")><span></span></div>', directive);

    expect(text(lines)).toEqual([
      'root.heading;',
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
    const lines = run('<my-el title="{heading}" @@myDirective(display="{mode}")></my-el>', component, directive);

    expect(text(lines)).toEqual([
      '{',
      '  (root.heading) satisfies string;',
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

  it('throws when a property of a directive is bound without a value', () => {
    expect(() => run('<div @@myDirective(display visible="{ true }")></div>', directiveMetadata(properties))).toThrow('Property "display" needs a value');
  });

  it('throws when required properties are missing', () => {
    expect(() => run('<div @@myDirective(display="block")></div>', directiveMetadata(properties))).toThrow('@@myDirective on <div> is missing the following required properties:\n ● visible');
  });

  it('types an event not declared as @Event as a native event of the element the directive is applied to', () => {
    const directive = directiveMetadata({}, { toggled: 'boolean' });
    const lines = run('<div @@myDirective((toggled)="f($event)" (click)="g($event)" (nope)="h()")></div>', directive);

    expect(text(lines)).toEqual([
      '{',
      '  let $event!: CustomEvent<boolean>;',
      '  root.f($event);',
      '}',
      '{',
      '  let $event!: HTMLElementEventMap[\'click\'];',
      '  root.g($event);',
      '}',
      'null! satisfies HTMLElementEventMap[\x27nope\x27];',
      'root.h();'
    ]);
  });

  it('types the native events bound in a directive through the event map of its element', () => {
    expect(text(run('<svg @@myDirective((click)="f($event)")></svg>', directiveMetadata({})))).toEqual([
      '{',
      '  let $event!: SVGElementEventMap[\'click\'];',
      '  root.f($event);',
      '}'
    ]);
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
      '    root.f();',
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
      '    root.f();',
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

  it('types an event not declared as @Event inside a conditional binding of a directive as a native event of its element', () => {
    const component = metadata({});
    const lines = run('<my-el @@myDirective(@if (cond()) { (click)="f($event)" })></my-el>', component, directiveMetadata({}));

    expect(text(lines)).toEqual([
      'if (root.cond()) {',
      '  {',
      '    let $event!: HTMLElementEventMap[\'click\'];',
      '    root.f($event);',
      '  }',
      '}'
    ]);
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
    const lines = run('<div @if (cond()) { title="{heading}" @@myDirective(display="{mode}") } @else { @@myDirective(display="none") }></div>', directiveMetadata({ display: properties.display }));

    expect(text(lines)).toEqual([
      'if (root.cond()) {',
      '  root.heading;',
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

describe('typeCheckElement structural directives', () => {
  const properties = {
    role: new ComponentPropertyMetadata('role', '\'admin\' | \'user\'', { required: true }),
    level: new ComponentPropertyMetadata('level', 'number')
  };

  it('type-checks structural directive properties after the directives, then processes children', () => {
    const directive = { ...directiveMetadata({ display: new ComponentPropertyMetadata('display', 'string') }), selector: 'other' } as DirectiveMetadata;
    const lines = run('<div *myDirective(role="admin" level="{count()}") @@other(display="{mode}")><span></span></div>', directiveMetadata(properties), directive);

    expect(text(lines)).toEqual([
      '{',
      '  (root.mode) satisfies string;',
      '}',
      '{',
      '  let x!: string;',
      '  x satisfies \'admin\' | \'user\';',
      '}',
      '{',
      '  (root.count()) satisfies number;',
      '}',
      'child;'
    ]);
  });

  it('accepts a structural directive declared without bindings', () => {
    expect(text(run('<div *myDirective></div>', directiveMetadata({})))).toEqual([]);
  });

  describe('content', () => {
    const processChild: ProcessNode = (child, context) => typeCheckElement(child as ElementNode, processChild, context);
    const runTree = (template: string) => {
      const context = new TypeCheckContext();
      context.addImport(directiveMetadata({}));
      return text(typeCheckElement(parse(template), processChild, context));
    };

    it('type-checks the content in a block of its own, declaring the template variables of the content first', () => {
      expect(runTree('<div *myDirective><input #field (input)="save(field.value)" /></div>')).toEqual([
        '{',
        '  let field!: (HTMLElementTagNameMap extends { \'input\': infer Type } ? Type : HTMLElement);',
        '  root.save(field.value);',
        '}'
      ]);
    });

    it('writes no block for a content declaring no template variable', () => {
      expect(runTree('<div @if (cond()) { *myDirective }><span title="{a}"></span></div>')).toEqual([
        'if (root.cond()) {',
        '}',
        'root.a;'
      ]);
    });
  });

  it('throws when the structural directive is not imported', () => {
    expect(() => run('<div *myDirective></div>')).toThrow('*myDirective selector is not associated to any Directive imported in the template');
  });

  it('throws for an unknown property', () => {
    expect(() => run('<div *myDirective(other="x")></div>', directiveMetadata({}))).toThrow('Unknown property "other" on *myDirective (MyDirective has no @Property with this name).');
  });

  it('throws when required properties are missing', () => {
    expect(() => run('<div *myDirective(level="{1}")></div>', directiveMetadata(properties))).toThrow('*myDirective on <div> is missing the following required properties:\n ● role');
  });

  it.each([
    ['a native element', '<div @if (cond()) { *myDirective(role="admin") } @else { @if (inner) { *myDirective(role="{current}") } }></div>'],
    ['a custom element', '<my-el @if (cond()) { *myDirective(role="admin") } @else { @if (inner) { *myDirective(role="{current}") } }></my-el>']
  ])('type-checks the structural directives applied inside a conditional binding of %s', (_description, template) => {
    const lines = run(template, metadata({}), directiveMetadata(properties));

    expect(text(lines)).toEqual([
      'if (root.cond()) {',
      '  {',
      '    let x!: string;',
      '    x satisfies \'admin\' | \'user\';',
      '  }',
      '}',
      'else {',
      '  if (root.inner) {',
      '    {',
      '      (root.current) satisfies \'admin\' | \'user\';',
      '    }',
      '  }',
      '}'
    ]);
  });

  describe('fine mappings', () => {
    const at = (template: string, text: string, from = 0) => ({ start: template.indexOf(text, from), end: template.indexOf(text, from) + text.length });

    it('maps the handler, the arguments and the name of a native event', () => {
      const template = '<div (click)="cart.save(item, $event)"></div>';
      const [, declaration, call] = run(template);

      expect(call.text).toBe('  root.cart.save(root.item, $event);');
      expect(call.mappings).toContainEqual({ columnStart: 7, columnEnd: 16, original: at(template, 'cart.save') });
      expect(call.mappings).toContainEqual({ columnStart: 22, columnEnd: 26, original: at(template, 'item') });
      expect(call.mappings).toContainEqual({ columnStart: 28, columnEnd: 34, original: at(template, '$event') });
      // The event name quoted in the type of $event
      expect(declaration.mappings).toContainEqual({ columnStart: 36, columnEnd: 41, original: at(template, 'click') });
    });

    it('maps the name of a native event bound on a component and not passed $event', () => {
      const template = '<my-el (clik)="f()"></my-el>';
      const [check] = run(template, metadata({}));

      expect(check.text).toBe('null! satisfies HTMLElementEventMap[\'clik\'];');
      expect(check.mappings).toContainEqual({ columnStart: 37, columnEnd: 41, original: at(template, 'clik') });
    });

    it('maps the expressions bound to the properties of a component and the conditions of the conditional bindings', () => {
      const template = '<my-el label="{title}" @if (shown) { size="{big}" } @switch (kind) { @case (1) { tone="{small}" } }></my-el>';
      const lines = run(template, metadata({ label: new ComponentPropertyMetadata('label', 'string'), size: new ComponentPropertyMetadata('size', 'number'), tone: new ComponentPropertyMetadata('tone', 'string') }));
      const lineOf = (text: string) => lines.find(line => line.text.includes(text))!;

      expect(lineOf('root.title').mappings).toContainEqual({ columnStart: 8, columnEnd: 13, original: at(template, 'title') });
      expect(lineOf('if (root.shown)').mappings).toContainEqual({ columnStart: 9, columnEnd: 14, original: at(template, 'shown') });
      expect(lineOf('switch (root.kind)').mappings).toContainEqual({ columnStart: 13, columnEnd: 17, original: at(template, 'kind') });
      expect(lineOf('case 1:').mappings).toEqual([{ columnStart: 7, columnEnd: 8, original: { start: template.indexOf('(1)') + 1, end: template.indexOf('(1)') + 2 } }]);
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

describe('typeCheckElement generic directives', () => {
  const owner = 'import(\'/src/my.directive\').MyDirective';

  /**
   * A directive whose property `items` and event `picked` are typed through its class instantiated with its type parameters,
   * as the metadata extraction writes them.
   */
  const genericDirective = (typeParameters: Array<[name: string, hasDefault?: boolean]> = [['T'], ['U']]) => {
    const instantiated = `${owner}<${typeParameters.map(([name]) => name).join(', ')}>`;
    return {
      ...directiveMetadata({ items: new ComponentPropertyMetadata('items', `ReturnType<${instantiated}['items']>`) }, { picked: `${instantiated}['picked']` }),
      typeParameters: typeParameters.map(([name, hasDefault = false]) => ({ name, hasDefault })),
      typescriptNodes: {
        klass: {
          name: { text: 'MyDirective' },
          typeParameters: typeParameters.map(([name]) => ({ name: { text: name } })),
          getSourceFile: () => ({ fileName: '/src/my.directive.ts' })
        }
      }
    } as unknown as DirectiveMetadata;
  };

  it('instantiates the class with the type arguments of the template around the checks of the directive, and reads the types of its bindings through it', () => {
    const lines = run('<div @@myDirective<string, Map<string, number>>(items="{names}" (picked)="onPick($event)")></div>', genericDirective());

    expect(text(lines)).toEqual([
      '{',
      `  type __Instance = ${owner}<string, Map<string, number>>;`,
      '  {',
      '    (root.names) satisfies ReturnType<__Instance[\'items\']>;',
      '  }',
      '  {',
      '    let $event!: CustomEvent<__Instance[\'picked\']>;',
      '    root.onPick($event);',
      '  }',
      '}'
    ]);
  });

  it('maps the type arguments, and the instantiation of the class, onto the template', () => {
    const template = '<div @@myDirective<string, number>(items="{names}")></div>';
    const lines = run(template, genericDirective());

    expect(lines[1].mappings!.map(({ original }) => template.slice(original.start, original.end))).toEqual(['string, number', 'string', 'number']);
  });

  it('writes a type argument naming a type the template imports like the type parameter as is, without a circular alias', () => {
    const lines = text(run('<div @@myDirective<T>(items="{names}")></div>', genericDirective([['T'], ['U', true]])));

    expect(lines[1]).toBe(`  type __Instance = ${owner}<T>;`);
  });

  it('infers nothing when the template passes type arguments: the class is instantiated with them only, as TypeScript does for a call', () => {
    const lines = text(run('<div @@myDirective<string>(items="{names}")></div>', genericDirective([['T'], ['U', true]])));

    // The type parameters left out take their default type, or are reported by TypeScript when they have none
    expect(lines.slice(0, 2)).toEqual(['{', `  type __Instance = ${owner}<string>;`]);
    expect(lines.some(entry => entry.includes('__probe'))).toBe(false);
  });

  it('maps the value of the call inferring the type parameters, and the instantiation of the class when there are no type arguments, onto the template', () => {
    const template = '<div @@myDirective(items="{names}")></div>';
    const lines = run(template, genericDirective());

    const mappings = lines.flatMap(({ mappings: lineMappings }) => lineMappings ?? []);
    expect(mappings.map(({ original }) => template.slice(original.start, original.end))).toEqual(expect.arrayContaining(['names', 'myDirective']));
  });

  it('infers from every bound property whose type is read from its accessor', () => {
    const metadata = genericDirective();
    metadata.properties.set('other', new ComponentPropertyMetadata('other', `ReturnType<${owner}<T, U>['other']>`));
    const lines = text(run('<div @@myDirective(items="{names}" other="{count}")></div>', metadata));

    expect(lines).toContain(`  function __probe<P0, P1>(value0: ${owner}<P0, P1>['items'], value1: ${owner}<P0, P1>['other']): [P0, P1] { return null!; }`);
    expect(lines).toContain('  const __probed = __probe(() => (root.names), () => (root.count));');
  });

  it('infers from a literal value as a string', () => {
    const literal = text(run('<div @@myDirective(items="abc")></div>', genericDirective()));

    expect(literal).toContain('  const __probed = __probe((): string => \'\');');
  });

  it('infers from every property bound, and leaves the type parameters without a value to their default type', () => {
    const metadata = genericDirective([['T'], ['U', true]]);
    const instantiated = text(run('<div @@myDirective(items="{names}")></div>', metadata)).find(entry => entry.includes('type __Instance'));

    // The default type is the one of the class instantiated without it, when nothing is inferred for it
    expect(instantiated).toBe(`  type __Instance = [unknown] extends [__Probed[1]] ? ${owner}<unknown extends __Probed[0] ? any : __Probed[0]> : ${owner}<unknown extends __Probed[0] ? any : __Probed[0], unknown extends __Probed[1] ? any : __Probed[1]>;`);
  });

  it('writes a single condition for the type parameters that all have a default type', () => {
    const instantiated = text(run('<div @@myDirective(items="{names}")></div>', genericDirective([['T', true], ['U', true]]))).find(entry => entry.includes('type __Instance'));

    expect(instantiated).toBe(`  type __Instance = [unknown, unknown] extends [__Probed[0], __Probed[1]] ? ${owner} : ${owner}<unknown extends __Probed[0] ? any : __Probed[0], unknown extends __Probed[1] ? any : __Probed[1]>;`);
  });

  it('instantiates a directive that binds nothing to infer from with the default types, or any, without declaring anything', () => {
    expect(text(run('<div @@myDirective((picked)="onPick($event)")></div>', genericDirective([['T', true], ['U', true]])))).toEqual([
      '{',
      `  let $event!: CustomEvent<${owner}['picked']>;`,
      '  root.onPick($event);',
      '}'
    ]);
    expect(text(run('<div @@myDirective((picked)="onPick($event)")></div>', genericDirective([['T'], ['U', true]])))).toContain(`  let $event!: CustomEvent<${owner}<any>['picked']>;`);
    expect(text(run('<div @@myDirective((picked)="onPick($event)")></div>', genericDirective()))).toContain(`  let $event!: CustomEvent<${owner}<any, any>['picked']>;`);
  });

  it('does not infer from a property whose type is not read from its accessor', () => {
    const metadata = genericDirective();
    metadata.properties.set('items', new ComponentPropertyMetadata('items', 'any'));

    expect(text(run('<div @@myDirective(items="{names}" (picked)="onPick($event)")></div>', metadata)).some(entry => entry.includes('__probe'))).toBe(false);
  });

  it('instantiates the class of a structural directive with its type arguments', () => {
    const lines = run('<div *myDirective<string>(items="{names}")></div>', genericDirective([['T']]));

    expect(text(lines).slice(0, 2)).toEqual(['{', `  type __Instance = ${owner}<string>;`]);
  });

  it('throws for type arguments on a directive that is not generic', () => {
    expect(() => run('<div @@myDirective<string>(display="x")></div>', directiveMetadata({ display: new ComponentPropertyMetadata('display', 'string') }))).toThrow('@@myDirective declares type arguments, but MyDirective is not generic.');
  });

  it('throws for more type arguments than the directive has type parameters', () => {
    expect(() => run('<div @@myDirective<string, number, boolean>(items="{names}")></div>', genericDirective())).toThrow('@@myDirective declares 3 type arguments, but MyDirective has 2 type parameters (T, U).');
  });
});

describe('typeCheckElement generic components', () => {
  const owner = 'import(\'/src/my.xd.component\').MyEl';

  /**
   * A component whose property `items` and event `picked` are typed through its class instantiated with its type
   * parameters, as the metadata extraction writes them.
   */
  const genericComponent = (typeParameters: Array<[name: string, hasDefault?: boolean]> = [['T'], ['U']]) => {
    const instantiated = `${owner}<${typeParameters.map(([name]) => name).join(', ')}>`;
    return {
      ...metadata({ items: new ComponentPropertyMetadata('items', `ReturnType<${instantiated}['items']>`) }, { picked: `${instantiated}['picked']` }),
      typeParameters: typeParameters.map(([name, hasDefault = false]) => ({ name, hasDefault })),
      typescriptNodes: {
        klass: {
          name: { text: 'MyEl' },
          typeParameters: typeParameters.map(([name]) => ({ name: { text: name } })),
          getSourceFile: () => ({ fileName: '/src/my.xd.component.ts' })
        }
      }
    } as unknown as ComponentMetadata;
  };

  it('infers the type parameters from the values bound to the properties, and reads the types of the bindings through the class instantiated with them', () => {
    expect(text(run('<my-el items="{names}" (picked)="onPick($event)"></my-el>', genericComponent()))).toEqual([
      '{',
      '  // @ts-ignore',
      `  function __probe<P0, P1>(value0: ${owner}<P0, P1>['items']): [P0, P1] { return null!; }`,
      '  // @ts-ignore',
      '  const __probed = __probe(() => (root.names));',
      '  type __Probed = typeof __probed;',
      `  type __Instance = ${owner}<unknown extends __Probed[0] ? any : __Probed[0], unknown extends __Probed[1] ? any : __Probed[1]>;`,
      '  {',
      '    (root.names) satisfies ReturnType<__Instance[\'items\']>;',
      '  }',
      '  {',
      '    let $event!: CustomEvent<__Instance[\'picked\']>;',
      '    root.onPick($event);',
      '  }',
      '}'
    ]);
  });

  it('maps the instantiation of the class onto the tag name of the element, where a type that does not satisfy a constraint is reported', () => {
    const template = '<my-el items="{names}"></my-el>';
    const mappings = run(template, genericComponent()).flatMap(({ mappings: lineMappings }) => lineMappings ?? []);

    expect(mappings.map(({ original }) => template.slice(original.start, original.end))).toEqual(expect.arrayContaining(['names', 'my-el']));
  });

  it('instantiates a component that binds nothing to infer from with the default types, or any, without declaring anything', () => {
    expect(text(run('<my-el (picked)="onPick($event)"></my-el>', genericComponent([['T', true], ['U', true]])))).toEqual([
      '{',
      `  let $event!: CustomEvent<${owner}['picked']>;`,
      '  root.onPick($event);',
      '}'
    ]);
  });

  it('instantiates the class with the type arguments of the element, each one mapped onto the template', () => {
    const template = '<my-el(string, Map<string, number>) items="{names}"></my-el>';
    const lines = run(template, genericComponent());

    expect(text(lines)).toEqual([
      '{',
      `  type __Instance = ${owner}<string, Map<string, number>>;`,
      '  {',
      '    (root.names) satisfies ReturnType<__Instance[\'items\']>;',
      '  }',
      '}'
    ]);
    // The instantiation is mapped onto all the type arguments, and each one onto its own span, where a type that doesn't satisfy a constraint is reported
    expect(lines[1].mappings!.map(({ original }) => template.slice(original.start, original.end))).toEqual(['string, Map<string, number>', 'string', 'Map<string, number>']);
    expect(lines[1].mappings![2]).toMatchObject({ columnStart: lines[1].text.indexOf('Map'), columnEnd: lines[1].text.lastIndexOf('>') });
  });

  it('infers nothing when the element declares type arguments, leaving the others to their default type', () => {
    const lines = text(run('<my-el(string) items="{names}"></my-el>', genericComponent([['T'], ['U', true]])));

    expect(lines.slice(0, 2)).toEqual(['{', `  type __Instance = ${owner}<string>;`]);
    expect(lines.some(entry => entry.includes('__probe'))).toBe(false);
  });

  describe('named by a template variable', () => {
    it('declares the instantiation in the scope of the variable, under names ending with the position of the element, and records it', () => {
      const context = new TypeCheckContext();
      context.addImport(genericComponent());

      expect(text(typeCheckElement(parse('<my-el #list items="{names}"></my-el>'), processNode, context))).toEqual([
        '// @ts-ignore',
        `function __probe0<P0, P1>(value0: ${owner}<P0, P1>['items']): [P0, P1] { return null!; }`,
        '// @ts-ignore',
        'const __probed0 = __probe0(() => (root.names));',
        'type __Probed0 = typeof __probed0;',
        `type __Instance0 = ${owner}<unknown extends __Probed0[0] ? any : __Probed0[0], unknown extends __Probed0[1] ? any : __Probed0[1]>;`,
        '{',
        '  (root.names) satisfies ReturnType<__Instance0[\'items\']>;',
        '}'
      ]);
      expect(context.hasInstantiation(0)).toBe(true);
    });

    it('declares the instantiation with the type arguments of the element, or with nothing to infer, in the scope of the variable', () => {
      expect(text(run('<my-el(string) #list items="{names}"></my-el>', genericComponent([['T'], ['U', true]])))[0]).toBe(`type __Instance0 = ${owner}<string>;`);
      expect(text(run('<my-el #list (picked)="onPick($event)"></my-el>', genericComponent([['T', true], ['U', true]])))).toEqual([
        `type __Instance0 = ${owner};`,
        '{',
        '  let $event!: CustomEvent<__Instance0[\'picked\']>;',
        '  root.onPick($event);',
        '}'
      ]);
    });

    it('records no instantiation for an element failing type-checking, nor for a component that is not generic', () => {
      const context = new TypeCheckContext();
      const required = genericComponent();
      required.properties.set('label', new ComponentPropertyMetadata('label', 'string', { required: true }));
      context.addImport(required);

      expect(() => typeCheckElement(parse('<my-el #list items="{names}"></my-el>'), processNode, context)).toThrow('my-el is missing the following required properties');
      expect(context.hasInstantiation(0)).toBe(false);

      const plainContext = new TypeCheckContext();
      plainContext.addImport(metadata({}));
      typeCheckElement(parse('<my-el #card></my-el>'), processNode, plainContext);
      expect(plainContext.hasInstantiation(0)).toBe(false);
    });
  });

  it('throws for type arguments on a component that is not generic', () => {
    expect(() => run('<my-el(string)></my-el>', metadata({}))).toThrow('<my-el> declares type arguments, but MyEl is not generic.');
  });

  it('throws for more type arguments than the type parameters of the component', () => {
    expect(() => run('<my-el(string, number, boolean)></my-el>', genericComponent())).toThrow('<my-el> declares 3 type arguments, but MyEl has 2 type parameters (T, U).');
  });

  it('throws for type arguments on a native element, or a custom element of another library', () => {
    expect(() => run('<div(string)></div>')).toThrow('<div> declares type arguments, but only a WebComponent imported in the template can declare them.');
    const foreignContext = new TypeCheckContext();
    foreignContext.addCustomElementPatterns('sl-*');
    expect(() => typeCheckElement(parse('<sl-button(string)></sl-button>'), processNode, foreignContext)).toThrow('<sl-button> declares type arguments, but only a WebComponent imported in the template can declare them.');
  });
});
