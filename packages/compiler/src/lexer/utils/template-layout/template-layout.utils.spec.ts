import { describe, expect, it } from 'vitest';
import { parseTemplateLayout } from './template-layout.utils';

describe('parseTemplateLayout', () => {
  it('reads text, interpolations and comments, with the whitespace as written', () => {
    expect(parseTemplateLayout('  Hello { name }!\n<!-- note -->\n')).toEqual([
      { kind: 'text', value: '  Hello ' },
      { kind: 'interpolation', expression: ' name ' },
      { kind: 'text', value: '!\n' },
      { kind: 'comment', value: '<!-- note -->' },
      { kind: 'text', value: '\n' }
    ]);
  });

  it('reads an interpolation whose expression holds braces and strings', () => {
    expect(parseTemplateLayout('{ { a: \'}\' } }')).toEqual([{ kind: 'interpolation', expression: ' { a: \'}\' } ' }]);
  });

  it('reads an element with its attributes, events and children', () => {
    expect(parseTemplateLayout('<a class="x" disabled (click)="go($event)" title=\'he said "hi"\'>text<b>bold</b></a>')).toEqual([{
      kind: 'element',
      name: 'a',
      selfClosing: false,
      items: [
        { kind: 'attribute', name: 'class', value: 'x' },
        { kind: 'attribute', name: 'disabled' },
        { kind: 'event', name: 'click', value: 'go($event)' },
        { kind: 'attribute', name: 'title', value: 'he said "hi"' }
      ],
      children: [
        { kind: 'text', value: 'text' },
        { kind: 'element', name: 'b', selfClosing: false, items: [], children: [{ kind: 'text', value: 'bold' }] }
      ]
    }]);
  });

  it('reads a self-closing element and a void element without content', () => {
    expect(parseTemplateLayout('<br/><input type="text">')).toEqual([
      { kind: 'element', name: 'br', selfClosing: true, items: [] },
      { kind: 'element', name: 'input', selfClosing: false, items: [{ kind: 'attribute', name: 'type', value: 'text' }] }
    ]);
  });

  it('keeps the content of <pre>, <textarea>, <script> and <style> as written', () => {
    expect(parseTemplateLayout('<pre>  a\n  { b }\n</pre>')).toEqual([{ kind: 'element', name: 'pre', selfClosing: false, items: [], raw: '  a\n  { b }\n' }]);
    expect(parseTemplateLayout('<style>a { color: red }</style>')).toEqual([{ kind: 'element', name: 'style', selfClosing: false, items: [], raw: 'a { color: red }' }]);
  });

  it('reads the directives and structural directives of a tag, with their type arguments and bindings', () => {
    const [element] = parseTemplateLayout('<p @@tooltip<Map<string, number>>(text="a" (shown)="log()") @@plain *each(of="{ rows }")></p>') as [{ items: unknown[] }];

    expect(element.items).toEqual([
      {
        kind: 'directive',
        prefix: '@@',
        name: 'tooltip',
        typeArguments: 'Map<string, number>',
        items: [{ kind: 'attribute', name: 'text', value: 'a' }, { kind: 'event', name: 'shown', value: 'log()' }]
      },
      { kind: 'directive', prefix: '@@', name: 'plain' },
      { kind: 'directive', prefix: '*', name: 'each', items: [{ kind: 'attribute', name: 'of', value: '{ rows }' }] }
    ]);
  });

  it('reads the element ref of an element, and the one of a <template> with its parameters', () => {
    expect(parseTemplateLayout('<input #field type="text" /><template row(item: Item, render: (value: \')\') => void)></template>')).toEqual([
      { kind: 'element', name: 'input', selfClosing: true, items: [{ kind: 'ref', name: 'field' }, { kind: 'attribute', name: 'type', value: 'text' }] },
      { kind: 'element', name: 'template', selfClosing: false, items: [{ kind: 'declaration', name: 'row', parameters: 'item: Item, render: (value: \')\') => void' }], children: [] }
    ]);
  });

  it('reads the render of a template, with its arguments as written', () => {
    expect(parseTemplateLayout('<p></p>@render  row( item(), \')\' )text')).toEqual([
      { kind: 'element', name: 'p', selfClosing: false, items: [], children: [] },
      { kind: 'render', callee: 'row', args: ' item(), \')\' ' },
      { kind: 'text', value: 'text' }
    ]);
  });

  it('reads a @let, with its value as written', () => {
    expect(parseTemplateLayout('<p></p>@let   total =  f(\';\', { a; }) ;text')).toEqual([
      { kind: 'element', name: 'p', selfClosing: false, items: [], children: [] },
      { kind: 'let', name: 'total', value: '  f(\';\', { a; }) ' },
      { kind: 'text', value: 'text' }
    ]);
  });

  it('reads the type arguments of an element, between the parentheses following its tag name', () => {
    expect(parseTemplateLayout('<ex-list(Map<string, number>, (value: string) => void) items="a"></ex-list>')).toEqual([
      {
        kind: 'element',
        name: 'ex-list',
        typeArguments: 'Map<string, number>, (value: string) => void',
        selfClosing: false,
        items: [{ kind: 'attribute', name: 'items', value: 'a' }],
        children: []
      }
    ]);
  });

  it('reads the conditional bindings of a tag, the @else branches and the cases of a @switch included', () => {
    const [element] = parseTemplateLayout('<p @if ( a ) { id="x" } @else if (b) { hidden } @else { lang="it" } @switch (c) { @case (1) @case (2) { dir="ltr" } @default { } }></p>') as [{ items: unknown[] }];

    expect(element.items).toEqual([
      {
        kind: 'block',
        keyword: 'if',
        branches: [
          { keyword: 'if', condition: 'a', body: [{ kind: 'attribute', name: 'id', value: 'x' }] },
          { keyword: 'else if', condition: 'b', body: [{ kind: 'attribute', name: 'hidden' }] },
          { keyword: 'else', body: [{ kind: 'attribute', name: 'lang', value: 'it' }] }
        ]
      },
      {
        kind: 'block',
        keyword: 'switch',
        expression: 'c',
        branches: [
          { keyword: 'case', condition: '1' },
          { keyword: 'case', condition: '2', body: [{ kind: 'attribute', name: 'dir', value: 'ltr' }] },
          { keyword: 'default', body: [] }
        ]
      }
    ]);
  });

  it('reads the blocks between elements: @if with its branches, @for, @switch', () => {
    const atoms = parseTemplateLayout('@if (a) {x} @else {y}@for (item of items; track item.id) {<i></i>}@switch (s) { @case (\'a\') { z } }');

    expect(atoms).toEqual([
      { kind: 'block', keyword: 'if', branches: [{ keyword: 'if', condition: 'a', body: [{ kind: 'text', value: 'x' }] }, { keyword: 'else', body: [{ kind: 'text', value: 'y' }] }] },
      { kind: 'block', keyword: 'for', branches: [{ keyword: 'for', condition: 'item of items; track item.id', body: [{ kind: 'element', name: 'i', selfClosing: false, items: [], children: [] }] }] },
      { kind: 'block', keyword: 'switch', expression: 's', branches: [{ keyword: 'case', condition: '\'a\'', body: [{ kind: 'text', value: ' z ' }] }] }
    ]);
  });

  it('leaves the whitespace after an @if that is not followed by an @else to the content', () => {
    expect(parseTemplateLayout('@if (a) { x }\n<b></b>')).toEqual([
      { kind: 'block', keyword: 'if', branches: [{ keyword: 'if', condition: 'a', body: [{ kind: 'text', value: ' x ' }] }] },
      { kind: 'text', value: '\n' },
      { kind: 'element', name: 'b', selfClosing: false, items: [], children: [] }
    ]);
  });

  it('reads a template that does not compile as long as its tags and blocks are closed', () => {
    expect(parseTemplateLayout('<p>{ 1 +', )).toBeUndefined();
    expect(parseTemplateLayout('<unknown-tag nope="{ }">{ ?? }</unknown-tag>')).toBeDefined();
  });

  it.each([
    ['a } that closes no block', '<p>}</p>'],
    ['a closing tag that closes no element', '</p>'],
    ['an element that is not closed', '<p>text'],
    ['an element closed by another one', '<p></b>'],
    ['a closing tag that is not closed', '<p></p'],
    ['a closing tag that is not terminated', '<p></p <b>'],
    ['a name that is missing', '<>'],
    ['a comment that is not closed', '<!-- note'],
    ['an interpolation that is not closed', '{ a'],
    ['a block that is not closed', '@if (a) { text'],
    ['a keyword that opens no block', '@foo (a) { }'],
    ['an @else without an @if', '@else { }'],
    ['something other than an @else after an @if', '@if (a) { } @elsewhere { }'],
    ['a condition that is missing', '@if { }'],
    ['a condition that is not between parentheses', '@switch a { }'],
    ['a condition that is not closed', '@if (a { }'],
    ['a { that is missing', '@if (a) text'],
    ['something other than a case in a @switch', '@switch (a) { <p></p> }'],
    ['a keyword other than a case in a @switch', '@switch (a) { @if (b) { } }'],
    ['a case that is not closed', '@switch (a) { @case (1) { x }'],
    ['an attribute value that is not quoted', '<p a=b></p>'],
    ['an attribute value whose quote is not closed', '<p a="b></p>'],
    ['an event that is not followed by its handler', '<p (click)></p>'],
    ['an element ref without a name', '<p # title="a"></p>'],
    ['the parameters of a template that are not closed', '<template row(item: Item></template>'],
    ['a @render without a name', '@render (a)'],
    ['a @render without arguments', '@render row <p></p>'],
    ['a @render whose arguments are not closed', '@render row(a'],
    ['a @let without =', '@let total 1;'],
    ['a @let without ;', '@let total = 1'],
    ['an event whose parenthesis is not closed', '<p (click="x"></p>'],
    ['a directive whose type arguments are not closed', '<p @@a<b(c="d")'],
    ['an element whose type arguments are not closed', '<ex-a(b c="d"></ex-a>'],
    ['a directive whose bindings are not closed', '<p @@a(b="c"></p>'],
    ['a tag that is not closed', '<p a="b"'],
    ['a @for in a tag', '<p @for (a of b) { c="d" }></p>'],
    ['an @ in a tag that opens no block', '<p @ ></p>'],
    ['a / in a tag that does not close it', '<p / ></p>'],
    ['a <pre> that is not closed', '<pre>text'],
    ['an @import after the header', '<p></p>@import { A } from \'./a\';']
  ])('finds no layout for %s', (_name, source) => {
    expect(parseTemplateLayout(source)).toBeUndefined();
  });
});
