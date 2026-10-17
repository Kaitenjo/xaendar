import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { Token } from '../../../lexer/types/token.type';
import { ElementNode } from '../../types/nodes/element-node.type';
import type { TemplateNode } from '../../types/nodes/template-node.type';
import { Parser } from '../../parser/parser';
import { ASTNodeType } from '../../types/node.enum';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();
const parseTokens = (tokens: Token[]) => new Parser('', tokens).parse();

describe('parseElement', () => {
  it('parses an element with children', () => {
    const [node] = parse('<div>text<span></span></div>') as ElementNode[];
    expect(node.tagName).toBe('div');
    expect(node.children.map(c => c.type)).toEqual([ASTNodeType.Text, ASTNodeType.Element]);
  });

  it('parses a self-closing element', () => {
    const [node] = parse('<input />') as ElementNode[];
    expect(node).toMatchObject({ tagName: 'input', children: [] });
  });

  it('parses attributes, events and conditional bindings', () => {
    const [node] = parse('<div class="a" (click)="f()" @if (cond()) { title="x" } @switch (mode()) { @case (1) { id="y" } }></div>') as ElementNode[];
    expect(node.attributes).toHaveLength(1);
    expect(node.events).toHaveLength(1);
    expect(node.conditionalBindings.map(({ type }) => type)).toEqual([ASTNodeType.IfBinding, ASTNodeType.SwitchBinding]);
  });

  it('parses the conditional bindings of a self-closing element', () => {
    const [node] = parse('<input @if (cond()) { disabled } />') as ElementNode[];
    expect(node.conditionalBindings).toHaveLength(1);
    expect(node.children).toEqual([]);
  });

  it('parses the type arguments following the tag name, with their span in the template', () => {
    const template = '<my-list(string, Map<string, number>) items="{rows}"></my-list>';
    const [node] = parse(template) as ElementNode[];

    expect(node.tagName).toBe('my-list');
    expect(node.nameSpan).toEqual({ start: 1, end: 8 });
    expect(node.typeArguments).toEqual([
      { text: 'string', span: { start: 9, end: 15 } },
      { text: 'Map<string, number>', span: { start: template.indexOf('Map'), end: template.indexOf(') items') } }
    ]);
    expect(node.closeNameSpan).toEqual({ start: template.lastIndexOf('my-list'), end: template.lastIndexOf('>') });
  });

  it('parses the type arguments of a self-closing element', () => {
    const [node] = parse('<my-list(string)/>') as ElementNode[];

    expect(node).toMatchObject({ tagName: 'my-list', typeArguments: [{ text: 'string' }], children: [] });
  });

  it('parses directives', () => {
    const [node] = parse('<div @@first @@second(display="block")></div>') as ElementNode[];
    expect(node.directives.map(({ selector }) => selector)).toEqual(['first', 'second']);
  });

  it('parses the directives of a self-closing element', () => {
    const [node] = parse('<input @@myDirective />') as ElementNode[];
    expect(node.directives).toHaveLength(1);
  });

  it('throws when a directive is applied more than once', () => {
    expect(() => parse('<div @@myDirective @@myDirective(display="block")></div>')).toThrow('Directive "myDirective" is applied more than once on <div>');
  });

  it('throws when a directive property is bound more than once', () => {
    expect(() => parse('<div @@myDirective(display="block" display="{none()}")></div>')).toThrow('Property "display" of directive "myDirective" is bound more than once on <div>');
  });

  it.each([
    ['on the element and inside a conditional binding', '<div @@myDirective @if (cond()) { @@myDirective }></div>'],
    ['inside a conditional binding and on the element after it', '<div @if (cond()) { @@myDirective } @@myDirective></div>'],
    ['inside two conditional bindings', '<div @if (first()) { @@myDirective } @if (second()) { @@myDirective }></div>'],
    ['inside a nested conditional binding', '<div @if (first()) { @@myDirective @if (second()) { @@myDirective } }></div>'],
    ['in a branch of a switch and inside another conditional binding', '<div @switch (mode()) { @case (1) { @@other } @default { @@myDirective } } @if (cond()) { @@myDirective }></div>']
  ])('throws when a directive is applied more than once %s', (_description, template) => {
    expect(() => parse(template)).toThrow('Directive "myDirective" is applied more than once on <div>');
  });

  it.each([
    ['in the directive and inside one of its conditional bindings', '<div @@myDirective(display="block" @if (cond()) { display="none" })></div>'],
    ['inside two conditional bindings of the directive', '<div @@myDirective(@if (first()) { display="block" } @if (second()) { display="none" })></div>'],
    ['in a directive applied inside a conditional binding', '<div @if (cond()) { @@myDirective(display="block" display="none") }></div>']
  ])('throws when a directive property is bound more than once %s', (_description, template) => {
    expect(() => parse(template)).toThrow('Property "display" of directive "myDirective" is bound more than once on <div>');
  });

  it('allows a directive property to share its name with an element attribute or another directive property', () => {
    const [node] = parse('<div title="a" @@first(title="b") @@second(title="c")></div>') as ElementNode[];
    expect(node.directives).toHaveLength(2);
  });

  it('allows the same event to be bound more than once', () => {
    const [node] = parse('<div (click)="f()" (click)="g()" @if (cond()) { (click)="h()" }></div>') as ElementNode[];
    expect(node.events).toHaveLength(2);
  });

  it.each([
    ['on the element', '<div title="a" title="{b}"></div>'],
    ['on the element and in a conditional binding', '<div title="a" @if (cond()) { title="b" }></div>'],
    ['in a conditional binding and on the element after it', '<div @if (cond()) { title="b" } title="a"></div>'],
    ['on the element and in the last branch of a conditional binding', '<div title="a" @if (cond()) { id="b" } @else if (other()) { id="c" } @else { title="d" }></div>'],
    ['in two conditional bindings', '<div @if (cond()) { title="a" } @if (other()) { title="b" }></div>'],
    ['in a branch of a switch and in a following conditional binding', '<div @switch (mode()) { @case (1) { title="a" } @default { id="b" } } @if (cond()) { title="c" }></div>'],
    ['in a nested conditional binding', '<div @if (cond()) { title="a" @if (other()) { title="b" } }></div>'],
    ['in a branch and in the branches of a conditional binding nested in it', '<div @if (cond()) { @if (other()) { title="a" } @else { title="b" } title="c" }></div>'],
    ['twice in the same branch', '<div @if (cond()) { id="a" } @else { title="b" title="c" }></div>']
  ])('throws when an attribute is bound more than once %s', (_description, template) => {
    expect(() => parse(template)).toThrow('Attribute "title" is bound more than once on <div>');
  });

  it.each([
    ['an @if chain', '<div @if (a()) { title="x" } @else if (b()) { title="y" } @else { title="z" }></div>'],
    ['a @switch', '<div @switch (mode()) { @case (1) { title="x" } @case (2) { title="y" } @default { title="z" } }></div>'],
    ['nested conditional bindings', '<div @if (a()) { @if (b()) { title="x" } @else { title="y" } } @else { title="z" }></div>']
  ])('allows an attribute to be bound in every branch of %s, since only one of them is applied at a time', (_description, template) => {
    expect(() => parse(template)).not.toThrow();
  });

  it('allows a directive to be applied, and its properties to be bound, in every branch of a conditional binding', () => {
    expect(() => parse('<div @if (a()) { @@myDirective(display="block") } @else { @@myDirective(display="none") }></div>')).not.toThrow();
    expect(() => parse('<div @@myDirective(@switch (mode()) { @case (1) { display="block" } @default { display="none" } })></div>')).not.toThrow();
  });

  describe('structural directives', () => {
    it('parses structural directives, keeping them apart from the directives', () => {
      const [node] = parse('<div *first @@myDirective *second(role="admin")></div>') as ElementNode[];
      expect(node.structuralDirectives.map(({ selector }) => selector)).toEqual(['first', 'second']);
      expect(node.directives.map(({ selector }) => selector)).toEqual(['myDirective']);
    });

    it('parses the structural directives of a self-closing element', () => {
      const [node] = parse('<input *hasRole />') as ElementNode[];
      expect(node.structuralDirectives).toHaveLength(1);
    });

    it('parses a valueless attribute followed by a structural directive, on the element and in a conditional binding', () => {
      const [node] = parse('<span hidden *hasRole(role="admin") @if (cond()) { disabled *visible }></span>') as ElementNode[];
      expect(node.attributes).toMatchObject([{ name: 'hidden', value: 'true' }]);
      expect(node.structuralDirectives.map(({ selector }) => selector)).toEqual(['hasRole']);
      expect(node.conditionalBindings[0].branches[0]).toMatchObject({ attributes: [{ name: 'disabled', value: 'true' }], structuralDirectives: [{ selector: 'visible' }] });
    });

    it.each([
      ['on the element', '<div *hasRole *hasRole(role="admin")></div>'],
      ['on the element and inside a conditional binding', '<div *hasRole @if (cond()) { *hasRole }></div>'],
      ['inside two conditional bindings', '<div @if (first()) { *hasRole } @if (second()) { *hasRole }></div>'],
      ['inside a nested conditional binding', '<div @if (first()) { *hasRole @if (second()) { *hasRole } }></div>']
    ])('throws when a structural directive is applied more than once %s', (_description, template) => {
      expect(() => parse(template)).toThrow('Structural directive "hasRole" is applied more than once on <div>');
    });

    it('throws when a structural directive property is bound more than once', () => {
      expect(() => parse('<div *hasRole(role="admin" role="{other()}")></div>')).toThrow('Property "role" of structural directive "hasRole" is bound more than once on <div>');
    });

    it('allows a structural directive to be applied in every branch of a conditional binding', () => {
      expect(() => parse('<div @if (a()) { *hasRole(role="admin") } @else { *hasRole(role="user") }></div>')).not.toThrow();
    });

    it('allows a structural directive to share its selector with a directive applied to the same element', () => {
      expect(() => parse('<div @@shared *shared></div>')).not.toThrow();
    });
  });

  describe('template variables', () => {
    it('parses the template variable naming the element, with the span of its name and of the whole of it', () => {
      const template = '<input disabled #field type="text" />';
      const [node] = parse(template) as ElementNode[];
      expect(node.variable).toEqual({
        name: 'field',
        nameSpan: { start: template.indexOf('field'), end: template.indexOf('field') + 5 },
        span: { start: template.indexOf('#'), end: template.indexOf('field') + 5 }
      });
      expect(node.attributes.map(({ name }) => name)).toEqual(['disabled', 'type']);
    });

    it('leaves the variable out of an element declaring none', () => {
      const [node] = parse('<input />') as ElementNode[];
      expect(node).not.toHaveProperty('variable');
    });

    it('throws when an element declares more than one template variable, pointing to the second one', () => {
      const template = '<input #first #second />';
      expect(() => parse(template)).toThrow('<input> declares more than one template variable (#first, #second): an element has a single name');
      expect(() => parse(template)).toThrow(expect.objectContaining({ span: { start: template.indexOf('#second'), end: template.indexOf(' />') } }));
    });

    it.each([
      ['directly', '<div #panel *hasRole(role="admin")></div>'],
      ['by a conditional binding', '<div #panel @if (cond()) { title="a" } @else { *hasRole }></div>'],
      ['by a nested conditional binding', '<div #panel @if (cond()) { @switch (mode()) { @case (1) { *hasRole } } }></div>']
    ])('throws for a template variable on an element a structural directive is applied to %s', (_description, template) => {
      expect(() => parse(template)).toThrow('<div> cannot declare #panel: its structural directives may not render it');
    });

    it('allows a template variable on an element whose conditional bindings apply no structural directive', () => {
      expect(() => parse('<div #panel @if (cond()) { title="a" @if (other()) { @@tint } }></div>')).not.toThrow();
    });

    it.each([
      ['not an identifier', '<input #2fields />', '\'2fields\' is not a valid name for a template variable'],
      ['reserved', '<input #root />', '\'root\' is reserved in templates']
    ])('throws for a name %s', (_description, template, message) => {
      expect(() => parse(template)).toThrow(message);
    });
  });

  describe('templates', () => {
    it('parses a <template> into the declaration of a template, with its name, its parameters and its content', () => {
      const template = '<template #row(item: Item, index: number)><li>{ item() }</li></template>';
      const [node] = parse(template) as TemplateNode[];
      const at = (text: string) => ({ start: template.indexOf(text), end: template.indexOf(text) + text.length });
      expect(node).toMatchObject({
        type: ASTNodeType.Template,
        nameSpan: { start: 1, end: 9 },
        closeNameSpan: { start: template.lastIndexOf('template'), end: template.lastIndexOf('template') + 8 },
        variable: { name: 'row', nameSpan: at('row'), span: at('#row') },
        parameters: [
          { name: 'item', nameSpan: at('item'), type: 'Item', typeSpan: at('Item') },
          { name: 'index', nameSpan: at('index'), type: 'number', typeSpan: at('number') }
        ],
        span: { start: 0, end: template.length }
      });
      expect(node.children.map(({ type }) => type)).toEqual([ASTNodeType.Element]);
    });

    it('parses a self-closing template without parameters', () => {
      const [node] = parse('<template #empty() />') as TemplateNode[];
      expect(node).toMatchObject({ type: ASTNodeType.Template, parameters: [], children: [] });
      expect(node).not.toHaveProperty('closeNameSpan');
    });

    it('throws for a <template> without name, pointing to its tag name', () => {
      const template = '<template></template>';
      expect(() => parse(template)).toThrow('A <template> declares a template: name it and list its parameters, e.g. <template #row(item: Item)>, then render it with @render row(item())');
      expect(() => parse(template)).toThrow(expect.objectContaining({ span: { start: 1, end: 9 } }));
    });

    it('throws for a template without parameters, pointing to its name', () => {
      const template = '<template #row></template>';
      expect(() => parse(template)).toThrow('A template lists its parameters in parentheses after its name, even when it has none: <template #row()>');
      expect(() => parse(template)).toThrow(expect.objectContaining({ span: { start: 10, end: 14 } }));
    });

    it.each([
      ['type arguments', '<template(string) #row()></template>', 'string'],
      ['an attribute', '<template #row() class="a"></template>', 'class="a"'],
      ['an event', '<template #row() (click)="go()"></template>', '(click)="go()"'],
      ['a conditional binding', '<template #row() @if (on()) { title="a" }></template>', '@if (on()) { title="a" }'],
      ['a directive', '<template #row() @@tint></template>', 'tint'],
      ['a structural directive', '<template #row() *hasRole></template>', 'hasRole']
    ])('throws for a template declaring %s, pointing to it', (_description, template, binding) => {
      expect(() => parse(template)).toThrow('A <template> declares only its name and its parameters, e.g. <template #row(item: Item)>: it renders nothing where it is declared, but where a @render calls it');
      expect(() => parse(template)).toThrow(expect.objectContaining({ span: expect.objectContaining({ start: template.indexOf(binding) }) }));
    });

    it('throws for invalid parameters', () => {
      expect(() => parse('<template #row(item)></template>')).toThrow('The parameter \'item\' of template "row" needs a type or a default value, e.g. item: string or item = \'\'');
    });
  });

  it('throws on a flow-control keyword not belonging to a conditional binding', () => {
    expect(() => parse('<div @else { title="x" }></div>')).toThrow('Unexpected token ELSE');
    expect(() => parse('<div @if (cond()) { title="x" } id="y" @else { title="z" }></div>')).toThrow('Unexpected token ELSE');
    expect(() => parse('<div hidden @case (1) { title="x" }></div>')).toThrow('Unexpected token CASE');
  });

  it('skips children for which parseNode returns nothing', () => {
    const tokens: Token[] = [
      { type: TokenType.TAG_OPEN_NAME, parts: ['div'], span: { start: 0, end: 4 } },
      { type: TokenType.TAG_OPEN_END, parts: [], span: { start: 4, end: 5 } },
      { type: TokenType.TAG_CLOSE_NAME, parts: ['div'], span: { start: 5, end: 11 } }
    ];
    expect(parseTokens(tokens)).toHaveLength(1);
  });

  it('throws when the opening tag is not terminated', () => {
    const tokens: Token[] = [{ type: TokenType.TAG_OPEN_NAME, parts: ['div'], span: { start: 0, end: 4 } }];
    expect(() => parseTokens(tokens)).toThrow('Unexpected token');
  });

  it('throws when the closing tag is missing', () => {
    const tokens: Token[] = [
      { type: TokenType.TAG_OPEN_NAME, parts: ['div'], span: { start: 0, end: 4 } },
      { type: TokenType.TAG_OPEN_END, parts: [], span: { start: 4, end: 5 } }
    ];
    expect(() => parseTokens(tokens)).toThrow('Expected closing tag div while file is over');
  });

  it('throws when the closing tag does not match', () => {
    expect(() => parse('<div></span>')).toThrow('Expected closing tag div, found span');
  });

  it('locates the tag name in the opening and in the closing tag', () => {
    const template = '<docs-search a="b"><i /></docs-search>';
    const [node] = parse(template) as ElementNode[];
    const [child] = node.children as ElementNode[];

    expect(node.nameSpan).toEqual({ start: 1, end: 12 });
    expect(node.closeNameSpan).toEqual({ start: 26, end: 37 });
    expect(template.slice(node.closeNameSpan!.start, node.closeNameSpan!.end)).toBe('docs-search');
    // A self-closing tag has no closing tag
    expect(child.nameSpan).toEqual({ start: 20, end: 21 });
    expect(child.closeNameSpan).toBeUndefined();
  });
});
