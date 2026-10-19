import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import type { ASTNode } from '../../../parser/types/ast.type';
import type { ForNode } from '../../../parser/types/nodes/for-node.type';
import type { InterpolationNode } from '../../../parser/types/nodes/interpolation-node.type';
import { validateExpression } from '../../../parser/utils/expression-validator/expression-validator';
import { checkVariableOrder } from './variable-order.utils';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();

/**
 * Returns the messages of the errors of a template, with the text of the template each one points to.
 */
const errorsOf = (template: string, ast: ASTNode[] = parse(template)) => checkVariableOrder(ast)?.map(({ message, cause }) => {
  const { start, end } = cause as { start: number, end: number };
  return [message, template.slice(start, end)];
});

const readBefore = (name: string) => `"${name}" is read before the element it names is created: only an event handler can read an element ref declared after it`;
const readByTrack = (name: string) => `The track expression of a @for cannot read the element ref "${name}": it only reads the item of the @for and its implicit variables`;

describe('checkVariableOrder', () => {
  it('accepts the reads of an element ref after its element, in its own bindings and in its children', () => {
    expect(errorsOf('<input value="{ field.placeholder }" #field title="{ field.value }"><b>{ field.value }</b></input><p>{ field.value }</p>')).toBeUndefined();
  });

  it('accepts the reads of the event handlers, which run once the template is rendered', () => {
    expect(errorsOf('<button (click)="pick(field, field.value)">Pick</button><label><input #field /></label>')).toBeUndefined();
  });

  it('reports a read evaluated as soon as its part is rendered, before the element of the variable, pointing to the read', () => {
    expect(errorsOf('<p title="{ field.value }">{ field.value }</p><label><input #field /></label>')).toEqual([
      [readBefore('field'), 'field'],
      [readBefore('field'), 'field']
    ]);
  });

  it('ignores the names of the members, the keys of the objects, and the names the template doesn\'t declare', () => {
    expect(errorsOf('<p>{ item.field } { { field: 1 } } { other } { Math.max(1, 2) }</p><input #field />')).toBeUndefined();
  });

  it('keeps the first declaration of a name declared twice in a scope, which TypeScript reports', () => {
    expect(errorsOf('<input #field /><p>{ field.value }</p><select #field />')).toBeUndefined();
    expect(errorsOf('@for (item of items(); track item()) { <p>{ item() }</p><input #item /> }')).toBeUndefined();
  });

  it('reports a read in a shorthand property', () => {
    expect(errorsOf('<p>{ { field } }</p><input #field />')).toEqual([[readBefore('field'), 'field']]);
  });

  describe('blocks', () => {
    it('checks the condition of an @if and of its @else if in the enclosing scope, and each branch in a scope of its own', () => {
      const template = [
        '@if (first.checked) { <p>{ inner.value } { first.value }</p><input #inner /> }',
        '@else if (second.checked) { <input #inner /><p>{ inner.value }</p> }',
        '@else { <p>{ inner.value }</p> }',
        '<input #first /><input #second />'
      ].join('');

      expect(errorsOf(template)).toEqual([
        [readBefore('first'), 'first'],
        [readBefore('inner'), 'inner'],
        [readBefore('first'), 'first'],
        [readBefore('second'), 'second']
      ]);
    });

    it('resolves a name to the innermost scope declaring it', () => {
      expect(errorsOf('<input #field />@if (open()) { <p>{ field.value }</p><select #field /> }')).toEqual([[readBefore('field'), 'field']]);
    });

    it('checks the expression of a @switch in the enclosing scope, and each case in a scope of its own', () => {
      expect(errorsOf('@switch (field.value) { @case (\'a\') { <p>{ inner.value }</p><input #inner /> } }<input #field />')).toEqual([
        [readBefore('field'), 'field'],
        [readBefore('inner'), 'inner']
      ]);
    });

    it('checks the iterable of a @for in the enclosing scope, and its body in the scope of the loop, where its variables exist from the start', () => {
      expect(errorsOf('@for (item of field.items; track item(); index = $index) { <p>{ item() } { index() } { $odd() } { row.value }</p><input #row /> }<input #field />')).toEqual([
        [readBefore('field'), 'field'],
        [readBefore('row'), 'row']
      ]);
    });

    it('reports an element ref read by the track expression of a @for, declared by its body or outside of it', () => {
      expect(errorsOf('<input #field />@for (item of items(); track field.value + row.value + item()) { <input #row /> }')).toEqual([
        [readByTrack('field'), 'field'],
        [readByTrack('row'), 'row']
      ]);
    });
  });

  describe('bindings', () => {
    it('checks the conditions and the bindings of the conditional bindings, nested ones included', () => {
      const template = '<p @if (field.checked) { title="{ field.value }" @if (other) { id="{ field.id }" } } @else { lang="{ field.lang }" } @switch (field.mode) { @case (1) { dir="{ field.dir }" } }></p><input #field />';

      expect(errorsOf(template)?.map(([, read]) => read)).toEqual(['field', 'field', 'field', 'field', 'field', 'field']);
    });

    it('checks the class bindings, of the element and of its conditional bindings', () => {
      const template = '<p [class.on]="{ field.checked }" @if (other) { [class.big]="{ field.value }" }></p><input #field />';

      expect(errorsOf(template)?.map(([, read]) => read)).toEqual(['field', 'field']);
    });

    it('checks the bindings of the directives and of the structural directives, and of the ones applied by a conditional binding', () => {
      const template = '<p @if (other) { @@tint(color="{ field.value }") *visible(when="{ field.checked }") } @@mark(text="{ field.title }") *shown(when="{ field.hidden }")></p><input #field />';

      expect(errorsOf(template)?.length).toBe(4);
    });

    it('checks the content of an element a structural directive is applied to in a scope of its own', () => {
      expect(errorsOf('<div *visible><p>{ inner.value }</p><input #inner /></div><p>{ inner.value }</p>')).toEqual([[readBefore('inner'), 'inner']]);
    });
  });

  describe('templates', () => {
    const readByRender = (name: string, callee: string) => `"${name}" is read by the template rendered by @render ${callee} before the element it names is created: render the template after the element, or read the ref from an event handler`;

    it('checks the arguments of a @render, evaluated when it is rendered', () => {
      expect(errorsOf('@render row(field.value)<input #field /><template #row(value: string) />')).toEqual([[readBefore('field'), 'field']]);
    });

    it('checks the reads of the content of a template against its own element refs, and accepts its parameters and the templates', () => {
      expect(errorsOf('<template #row(item: Item)><p>{ item() } { other } { inner.value }</p><input #inner /><template #other() /></template>')).toEqual([[readBefore('inner'), 'inner']]);
    });

    it('checks the default values of the parameters like the content of the template, against its own element refs and each @render', () => {
      expect(errorsOf('<template #row(label = inner.value)><input #inner /></template>')).toEqual([[readBefore('inner'), 'inner']]);
      expect(errorsOf('@render row()<input #field /><template #row(label = field.value) />')).toEqual([[readByRender('field', 'row'), 'row']]);
      expect(errorsOf('<input #field /><template #row(item: Item, label = item().name + field.value) />@render row(1)')).toBeUndefined();
    });

    it('checks the element refs declared outside of a template, which its content reads, against each @render of the template', () => {
      const template = '<template #row()><p>{ field.value }</p></template>@render row()<input #field />@render row()';
      expect(errorsOf(template)).toEqual([[readByRender('field', 'row'), 'row']]);
      const callee = template.indexOf('@render row()') + '@render '.length;
      expect(checkVariableOrder(parse(template))![0].cause).toEqual({ start: callee, end: callee + 3 });
    });

    it('accepts the reads of a template rendered after the elements it reads, and the reads of its event handlers', () => {
      expect(errorsOf('<input #field />@render row()<template #row()><p (click)="pick(late)">{ field.value }</p></template><input #late />')).toBeUndefined();
    });

    it('spreads the reads of a template to the templates rendering it, up to the part of the template declaring what they read', () => {
      const template = [
        '@render outer()',
        '<input #field />',
        '<template #outer()>@render inner()</template>',
        '<template #inner()><p>{ field.value }</p></template>',
        '@render outer()'
      ].join('');
      expect(errorsOf(template)).toEqual([[readByRender('field', 'outer'), 'outer']]);
    });

    it('checks an element ref declared in the content of a template, read by a template the content renders', () => {
      expect(errorsOf('<template #outer()>@render inner()<input #field /><template #inner()>{ field.value }</template></template>')).toEqual([[readByRender('field', 'inner'), 'inner']]);
    });

    it('terminates on a recursive template', () => {
      expect(errorsOf('<template #tree(node: Node)>{ field.value }@for (child of node().children; track child()) { @render tree(child()) }</template><input #field />@render tree(root)')).toBeUndefined();
    });

    it('ignores the @render of a name that is not a template, which the type-check reports', () => {
      expect(errorsOf('<input #field />@render field()')).toBeUndefined();
    });
  });

  describe('@let', () => {
    const readBeforeLet = (name: string) => `"${name}" is read before its @let: only an event handler can read a @let declared after it`;

    it('accepts the reads of a @let after it, nested elements included, and the reads of the event handlers', () => {
      expect(errorsOf('<button (click)="pick(total)">Go</button><div>@let total = 1;</div><p title="{ total }">{ total }</p>@let double = total * 2;')).toBeUndefined();
    });

    it('reports a read evaluated before the end of the @let, its own value included, and checks its value as such a read', () => {
      expect(errorsOf('<p>{ total }</p>@let total = total + field.value;<input #field />')).toEqual([
        [readBeforeLet('total'), 'total'],
        [readBeforeLet('total'), 'total'],
        [readBefore('field'), 'field']
      ]);
    });

    it('reports a @let read by a template rendered before it, and by the track expression of a @for', () => {
      expect(errorsOf('@render row()<template #row()>{ total }</template>@let total = 1;')).toEqual([[
        '"total" is read by the template rendered by @render row before its @let: render the template after the @let, or read it from an event handler', 'row'
      ]]);
      expect(errorsOf('@let total = 1;@for (item of items(); track total + item()) { }')).toEqual([[
        'The track expression of a @for cannot read the @let "total": it only reads the item of the @for and its implicit variables', 'total'
      ]]);
    });
  });

  it('points to the part declaring an expression whose positions in the template are unknown', () => {
    const template = '<p>{ x }</p><input #field />@for (item of items(); track item()) { }';
    const ast = parse(template);
    (ast[0] as unknown as { children: InterpolationNode[] }).children[0].expression = validateExpression('field.value').node;
    (ast[2] as ForNode).trackExpression = validateExpression('field.value').node;

    expect(errorsOf(template, ast)).toEqual([
      [readBefore('field'), 'x }'],
      [readByTrack('field'), '@for (item of items(); track item()) { }']
    ]);
  });
});
