import { describe, expect, it } from 'vitest';
import type { TemplateFormatOptions } from '../../types/template-format-options.type';
import { formatTemplate } from './template-format.utils';

const options: TemplateFormatOptions = { indent: '  ', indentWidth: 2, printWidth: 60 };

/**
 * Formats a template, failing the spec if its layout cannot be read.
 */
const format = (source: string, formatOptions = options): string => formatTemplate(source, formatOptions)!;

/**
 * Joins the lines of a template.
 */
const lines = (...rows: string[]): string => `${rows.join('\n')}\n`;

describe('formatTemplate', () => {
  describe('the spaces inside the braces of an interpolation', () => {
    it.each([
      ['an attribute', '<p title="{ title() }"></p>', '<p title="{title()}"></p>'],
      ['an attribute written without spaces', '<p title="{title()}"></p>', '<p title="{title()}"></p>'],
      ['an attribute with an expression written on several lines', '<p title="{\n  a ||\n  b\n}"></p>', '<p title="{a ||\n  b}"></p>'],
      ['a directive property', '<p @@tip(text="{  text() }")></p>', '<p @@tip(text="{text()}")></p>'],
      ['a property of a conditional binding', '<p @if (a) { id="{ id }" }></p>', null],
      ['an attribute that is not an interpolation', '<p title="a { b }"></p>', '<p title="a { b }"></p>'],
      ['an attribute written with single quotes', '<p title=\'{ "a" }\'></p>', '<p title=\'{"a"}\'></p>'],
      ['an event, which is not an interpolation', '<p (click)="go( { a: 1 } )"></p>', '<p (click)="go( { a: 1 } )"></p>']
    ])('removes them in %s', (_name, source, expected) => {
      if (expected !== null) {
        expect(format(source).trimEnd()).toBe(expected);
      }
    });

    it.each([
      ['text', '<p>{name}</p>', '<p>{ name }</p>'],
      ['text with more spaces', '<p>{   name   }</p>', '<p>{ name }</p>'],
      ['text with an expression written on several lines', '<p>{\n  a +\n  b\n}</p>', '<p>{ a +\n  b }</p>'],
      ['text around words', '<p>a{b}c</p>', '<p>a{ b }c</p>'],
      ['an empty interpolation', '<p>{}</p>', '<p>{}</p>'],
      ['a string', '<p>{\' \'}</p>', '<p>{ \' \' }</p>']
    ])('adds them in %s', (_name, source, expected) => {
      expect(format(source).trimEnd()).toBe(expected);
    });
  });

  describe('control flow', () => {
    it('writes a space after the keyword and before the brace, the @else branches on the line of the brace before them', () => {
      expect(format('@if(a){<p></p>}@else if(b){<i></i>}@else{<b></b>}')).toBe(lines(
        '@if (a) {',
        '  <p></p>',
        '} @else if (b) {',
        '  <i></i>',
        '} @else {',
        '  <b></b>',
        '}'
      ));
    });

    it('indents the content of a @for, one level deeper than its keyword', () => {
      expect(format('<ul>@for(item of items; track item.id){<li>{item}</li>}</ul>')).toBe(lines(
        '<ul>',
        '  @for (item of items; track item.id) {',
        '    <li>{ item }</li>',
        '  }',
        '</ul>'
      ));
    });

    it('writes the cases of a @switch one per line, the stacked ones without braces', () => {
      expect(format('@switch(status()){@case(\'a\')@case(\'b\'){<p>x</p>}@default{<p>y</p>}}')).toBe(lines(
        '@switch (status()) {',
        '  @case (\'a\')',
        '  @case (\'b\') {',
        '    <p>x</p>',
        '  }',
        '  @default {',
        '    <p>y</p>',
        '  }',
        '}'
      ));
    });

    it('writes a block with no content, or only whitespace, on two lines', () => {
      expect(format('@if (a) {}')).toBe(lines('@if (a) {', '}'));
      expect(format('<p>@if (a) {   }</p>')).toBe(lines('<p>', '  @if (a) {', '  }', '</p>'));
    });

    it('writes the text of a block on its own lines when it already was, and leaves it tight otherwise', () => {
      expect(format('@if (a) {\n      Remove\n    } @else {\n  Add\n}')).toBe(lines('@if (a) {', '  Remove', '} @else {', '  Add', '}'));
      expect(format('@if (a) {tight}')).toBe(lines('@if (a) {tight}'));
    });

    it('indents a block inside an element, and an element inside a block', () => {
      expect(format('<button>@if (shown()) {Remove the list} @else {\n      Add the list\n    }</button>')).toBe(lines(
        '<button>',
        '  @if (shown()) {Remove the list} @else {',
        '    Add the list',
        '  }',
        '</button>'
      ));
    });
  });

  describe('elements', () => {
    it('writes every child element on its own line, one level deeper, and the closing tag on its own line', () => {
      expect(format('<div><p>a</p><ul><li>b</li></ul></div>')).toBe(lines(
        '<div>',
        '  <p>a</p>',
        '  <ul>',
        '    <li>b</li>',
        '  </ul>',
        '</div>'
      ));
    });

    it('indents again the children that are badly indented', () => {
      expect(format('<div>\n      <p>a</p>\n  <p>b</p>\n</div>')).toBe(lines('<div>', '  <p>a</p>', '  <p>b</p>', '</div>'));
    });

    it('writes a self-closing element with a space before the slash, and leaves an element without content as it is', () => {
      expect(format('<br/><input type="text"/><div></div><p> </p>')).toBe(lines('<br />', '<input type="text" />', '<div></div>', '<p> </p>'));
    });

    it('writes a blank content on two lines when it was written on two', () => {
      expect(format('<div>\n</div>')).toBe(lines('<div>', '</div>'));
    });

    it('keeps a text-only element on one line, and the text of several lines indented', () => {
      expect(format('<span class="count">{ total() } items</span>')).toBe(lines('<span class="count">{ total() } items</span>'));
      expect(format('<p>\n        first\n    second\n\n\n   third\n</p>')).toBe(lines('<p>', '  first', '  second', '', '  third', '</p>'));
    });

    it('writes the text of an element on its own line when the element does not fit the line and the text can be moved', () => {
      expect(format('<p class="lead"> A text that is much too long to fit the line of the width </p>')).toBe(lines(
        '<p class="lead">',
        '  A text that is much too long to fit the line of the width',
        '</p>'
      ));
    });

    it('does not touch the text that touches the tags, so that no whitespace is added around it', () => {
      expect(format('<x-card class="card">A text that is much too long to fit the line of the width</x-card>')).toBe(lines(
        '<x-card class="card">A text that is much too long to fit the line of the width</x-card>'
      ));
      expect(format('<p class="lead">A text that is much too long to fit the line of the width </p>')).toBe(lines(
        '<p class="lead">A text that is much too long to fit the line of the width </p>'
      ));
    });

    it('writes an interpolation that does not fit on its own line', () => {
      expect(format('<p class="lead">{ aVeryLongNameOfAnExpression() + anotherVeryLongNameOfAnExpression() }</p>')).toBe(lines(
        '<p class="lead">',
        '  { aVeryLongNameOfAnExpression() + anotherVeryLongNameOfAnExpression() }',
        '</p>'
      ));
    });
  });

  describe('opening tags', () => {
    it('fills the lines with the items when the tag does not fit the width, the next lines indented, the closing character at the end', () => {
      expect(format('<button class="primary large" type="button" (click)="save()">Save</button>')).toBe(lines(
        '<button class="primary large" type="button"',
        '  (click)="save()">Save</button>'
      ));
    });

    it('goes on to a new line only when the next item does not fit, as many times as needed', () => {
      const click = ' (click)="append()"';
      const source = `<button${click.repeat(7)}>Add</button>`;

      expect(format(source, { ...options, printWidth: 50 })).toBe(lines(
        '<button (click)="append()" (click)="append()"',
        '  (click)="append()" (click)="append()"',
        '  (click)="append()" (click)="append()"',
        '  (click)="append()">Add</button>'
      ));
    });

    it('writes an item wider than the width on a line of its own', () => {
      expect(format('<p title="a very long value that does not fit the line at all, whatever the width" id="x"></p>')).toBe(lines(
        '<p',
        '  title="a very long value that does not fit the line at all, whatever the width"',
        '  id="x"></p>'
      ));
    });

    it('writes a self-closing element that does not fit with the slash at the end of the last line', () => {
      expect(format('<ex-component first="a long value" second="another long value" third="x" />')).toBe(lines(
        '<ex-component first="a long value"',
        '  second="another long value" third="x" />'
      ));
    });

    it('writes the text of an element whose tag is written on several lines on its own line, if it can be moved', () => {
      expect(format('<button class="primary large" type="button" (click)="save()"> Save </button>')).toBe(lines(
        '<button class="primary large" type="button"',
        '  (click)="save()">',
        '  Save',
        '</button>'
      ));
    });

    it('writes the conditional bindings of a tag as blocks, one item per line, whatever the width', () => {
      expect(format('<p @if(a){id="x" (click)="go()"}@else{lang="it"} title="t"></p>')).toBe(lines(
        '<p',
        '  @if (a) {',
        '    id="x"',
        '    (click)="go()"',
        '  } @else {',
        '    lang="it"',
        '  }',
        '  title="t"',
        '></p>'
      ));
    });

    it('writes the slash of a self-closing element with a conditional binding on a line of its own', () => {
      expect(format('<br @if(a){id="x"}/>')).toBe(lines(
        '<br',
        '  @if (a) {',
        '    id="x"',
        '  }',
        '/>'
      ));
    });

    it('writes the cases of a @switch of a tag, and an empty conditional binding', () => {
      expect(format('<p @switch(a){@case(1)@case(2){dir="ltr"}@default{}}></p>')).toBe(lines(
        '<p',
        '  @switch (a) {',
        '    @case (1)',
        '    @case (2) {',
        '      dir="ltr"',
        '    }',
        '    @default {',
        '    }',
        '  }',
        '></p>'
      ));
    });

    it('writes a directive on one line, with its type arguments, unless it holds a conditional binding', () => {
      expect(format('<p @@tip<  string >( text="a"  (shown)="log()" ) @@plain *each( of="{ rows }" )></p>')).toBe(lines(
        '<p @@tip<string>(text="a" (shown)="log()") @@plain',
        '  *each(of="{rows}")></p>'
      ));
      expect(format('<p @@tip(@if(a){text="a"})></p>')).toBe(lines(
        '<p',
        '  @@tip(',
        '    @if (a) {',
        '      text="a"',
        '    }',
        '  )',
        '></p>'
      ));
    });

    it('writes the element ref of an element, and the parameters of a <template> without the spaces around them', () => {
      expect(format('<input   #field   type="text"/>')).toBe(lines('<input #field type="text" />'));
      expect(format('<template row(  item: Item, index: number )>\n<li>{ item() }</li>\n</template>')).toBe(lines(
        '<template row(item: Item, index: number)>',
        '  <li>{ item() }</li>',
        '</template>'
      ));
    });

    it('writes a @render on a line of its own, without the spaces around its arguments', () => {
      expect(format('<ul><li>a</li>@render   row(  item(),  1 )</ul>@render empty()<p>b</p>')).toBe(lines(
        '<ul>',
        '  <li>a</li>',
        '  @render row(item(),  1)',
        '</ul>',
        '@render empty()',
        '<p>b</p>'
      ));
      expect(format('@if (a) { @render row(x) }')).toBe(lines(
        '@if (a) {',
        '  @render row(x)',
        '}'
      ));
    });

    it('writes a @let on a line of its own, with a space around its =', () => {
      expect(format('<p>a</p>@let   total=price()  *  2  ;<p>{ total() }</p>')).toBe(lines(
        '<p>a</p>',
        '@let total = price()  *  2;',
        '<p>{ total() }</p>'
      ));
    });

    it('writes the type arguments of an element right after its tag name, also when the tag is wrapped', () => {
      expect(format('<ex-list(  string,  number ) items="{rows}"/>')).toBe(lines('<ex-list(string,  number) items="{rows}" />'));
      expect(format('<ex-list(Row) items="{rows()}" label="A long enough label" (picked)="open($event)"></ex-list>')).toBe(lines(
        '<ex-list(Row) items="{rows()}" label="A long enough label"',
        '  (picked)="open($event)"></ex-list>'
      ));
      expect(format('<ex-list(Row) @if(a){items="{rows()}"}></ex-list>')).toBe(lines(
        '<ex-list(Row)',
        '  @if (a) {',
        '    items="{rows()}"',
        '  }',
        '></ex-list>'
      ));
    });

    it('writes an empty directive, and the attribute written with single quotes that holds double quotes', () => {
      expect(format('<p @@tip() title=\'say "hi"\'></p>')).toBe(lines('<p @@tip() title=\'say "hi"\'></p>'));
    });
  });

  describe('whitespace that is rendered', () => {
    it.each([
      ['a space between two interpolations', '<p>{a} {b}</p>', '<p>{ a } { b }</p>'],
      ['a space between an element and an interpolation', '<p><b>a</b> {b}</p>', '<p>\n  <b>a</b> { b }\n</p>'],
      ['the text before and after an element', '<p>Hello <b>w</b>, bye</p>', '<p>Hello <b>w</b>, bye</p>'],
      ['the punctuation after an element', '<p>\n  <code>a</code>,\n  <code>b</code>\n</p>', '<p>\n  <code>a</code>,\n  <code>b</code>\n</p>']
    ])('keeps %s', (_name, source, expected) => {
      expect(format(source, { ...options, printWidth: 200 }).trimEnd()).toBe(expected);
    });

    it.each([
      ['two elements without space', '<p><b>a</b><i>b</i></p>', '<p>\n  <b>a</b>\n  <i>b</i>\n</p>'],
      ['two elements with a space, which is dropped', '<p><b>a</b> <i>b</i></p>', '<p>\n  <b>a</b>\n  <i>b</i>\n</p>'],
      ['two elements with several spaces', '<p><b>a</b>   <i>b</i></p>', '<p>\n  <b>a</b>\n  <i>b</i>\n</p>'],
      ['an interpolation and the element that follows it', '<p>{a} <i>b</i></p>', '<p>\n  { a }\n  <i>b</i>\n</p>'],
      ['two elements split by a line break', '<p><b>a</b>\n<i>b</i></p>', '<p>\n  <b>a</b>\n  <i>b</i>\n</p>'],
      ['two interpolations without space', '<p>{a}{b}</p>', '<p>{ a }{ b }</p>'],
      ['two interpolations split by a line break', '<p>{a}\n{b}</p>', '<p>{ a }\n  { b }</p>'],
      ['an element and an interpolation without space', '<p><b>a</b>{b}</p>', '<p>\n  <b>a</b>\n  { b }\n</p>'],
      ['a space before the first element and after the last', '<p> <b>a</b> </p>', '<p>\n  <b>a</b>\n</p>']
    ])('writes every element on a line of its own, the space before it is not kept: %s', (_name, source, expected) => {
      expect(format(source, { ...options, printWidth: 200 }).trimEnd()).toBe(expected);
    });

    it('writes the element that follows one written on several lines on a line of its own', () => {
      expect(format('<p><button class="primary large" type="button" (click)="save()">Save</button> <i>after</i></p>')).toBe(lines(
        '<p>',
        '  <button class="primary large" type="button"',
        '    (click)="save()">Save</button>',
        '  <i>after</i>',
        '</p>'
      ));
    });

    it('measures the line after an element written on several lines when text follows it', () => {
      expect(format('<p>Use <button class="primary large" type="button" (click)="save()">Save</button> and <i class="note" id="x" title="a long title">x</i></p>')).toBe(lines(
        '<p>Use <button class="primary large" type="button"',
        '    (click)="save()">Save</button> and <i class="note"',
        '    id="x" title="a long title">x</i>',
        '</p>'
      ));
    });

    it('splits the elements of a line the way the default formatter does, as in a row of buttons', () => {
      expect(format('<div><button (click)="a()">A</button> <button (click)="b()">B</button></div> <ol></ol>')).toBe(lines(
        '<div>',
        '  <button (click)="a()">A</button>',
        '  <button (click)="b()">B</button>',
        '</div>',
        '<ol></ol>'
      ));
    });

    it('writes an interpolation and a block, or an element and a comment, as they are written next to each other', () => {
      expect(format('<p>{a}@if (x) {y}</p>')).toBe(lines('<p>', '  { a }', '  @if (x) {y}', '</p>'));
      expect(format('<input disabled /><!-- note -->')).toBe(lines('<input disabled /><!-- note -->'));
    });

    it('writes a block on its own line after an element, whatever the whitespace between them', () => {
      expect(format('<p><b>a</b> @if (x) {y}</p>')).toBe(lines('<p>', '  <b>a</b>', '  @if (x) {y}', '</p>'));
    });

    it('does not separate a text from the element that follows it', () => {
      expect(format('<p>Use <code>x</code>, then <b>y</b> or <i>z</i>.</p>')).toBe(lines('<p>Use <code>x</code>, then <b>y</b> or <i>z</i>.</p>'));
    });

    it('does not move an element or block that follows a text without whitespace', () => {
      expect(format('<p>text<b>a</b>more@if (a) {x}</p>')).toBe(lines('<p>text<b>a</b>more@if (a) {x}', '</p>'));
    });

    it('does not move the nodes next to a comment', () => {
      expect(format('<p><b>a</b><!-- note --><i>b</i> <!-- more --> <b>c</b></p>')).toBe(lines('<p>', '  <b>a</b><!-- note --><i>b</i> <!-- more --> <b>c</b>', '</p>'));
    });

    it('keeps the content of <pre> and <textarea> exactly as written', () => {
      expect(format('<div><pre>  a\n    { b }\n</pre><textarea>\n  x</textarea></div>')).toBe(lines(
        '<div>',
        '  <pre>  a',
        '    { b }',
        '</pre>',
        '  <textarea>',
        '  x</textarea>',
        '</div>'
      ));
    });
  });

  describe('comments', () => {
    it('keeps them as written, on their own line when they were', () => {
      expect(format('<div>\n<!-- a\n   multi-line\n   comment -->\n<p></p></div>')).toBe(lines(
        '<div>',
        '  <!-- a',
        '   multi-line',
        '   comment -->',
        '  <p></p>',
        '</div>'
      ));
    });

    it('moves a comment written on the line of the { of a block to the first line of its content, dropping the spaces before it', () => {
      const source = '@if (a) {      <!-- first -->\n  <p></p>     <!-- last -->     }';
      const expected = lines(
        '@if (a) {',
        '  <!-- first -->',
        '  <p></p>     <!-- last -->',
        '}'
      );

      expect(format(source)).toBe(expected);
      expect(format(expected)).toBe(expected);
    });
  });

  describe('the template as a whole', () => {
    it('keeps one blank line at most between the nodes, none at the start, and ends with one line break', () => {
      expect(format('\n\n<p></p>\n\n\n\n<p></p>\n\n\n')).toBe(lines('<p></p>', '', '<p></p>'));
    });

    it('writes the @import statements in a regular form, one blank line after them when there was one', () => {
      expect(format('@import {B,A} from "./a"\n@import {\n C\n} from \'./b\';\n\n\n<p></p>')).toBe(lines(
        '@import { B, A } from "./a"',
        '@import {',
        '  C',
        '} from \'./b\';',
        '',
        '<p></p>'
      ));
      expect(format('@import { A } from \'./a\';\n<p></p>')).toBe(lines('@import { A } from \'./a\';', '<p></p>'));
    });

    it('keeps the comments of the @import statements', () => {
      const source = '@import {A} from \'./a\';   <!-- a -->\n@import {B} from \'./b\';  <!-- b -->\n<p></p>';
      expect(format(source)).toBe(lines('@import { A } from \'./a\';   <!-- a -->', '@import { B } from \'./b\';  <!-- b -->', '<p></p>'));
    });

    it('writes only the header of a template that has nothing else, and nothing for an empty template', () => {
      expect(format('@import { A } from \'./a\';\n\n')).toBe(lines('@import { A } from \'./a\';'));
      expect(format('')).toBe('');
      expect(format(' \n ')).toBe('');
    });

    it('formats a template that is just text', () => {
      expect(format('  hello\n   world  ')).toBe(lines('hello', 'world'));
    });

    it('keeps the line breaks of a template written with CRLF', () => {
      expect(format('<div>\r\n<p>a</p>\r\n</div>')).toBe('<div>\r\n  <p>a</p>\r\n</div>\r\n');
    });

    it('indents with a tab, measuring it by the width of the indentation', () => {
      const tabs: TemplateFormatOptions = { indent: '\t', indentWidth: 4, printWidth: 30 };

      expect(format('<div><p class="long" id="identifier">a</p></div>', tabs)).toBe(lines(
        '<div>',
        '\t<p class="long"',
        '\t\tid="identifier">a</p>',
        '</div>'
      ));
    });

    it('does not format a template whose layout cannot be read, or whose header is not at its start', () => {
      expect(formatTemplate('<p>', options)).toBeUndefined();
      expect(formatTemplate('<!-- note -->\n@import { A } from \'./a\';\n<p></p>', options)).toBeUndefined();
    });

    it.each([
      '<div><p>a</p> text <b>{x}</b>\n  <i>y</i></div>',
      '@if (a) {\n<p class="x"  id="y">{ z }</p>\n} @else {\n<b></b>\n}',
      '<button class="primary large" type="button" (click)="save()"> Save </button>',
      '<p @if(a){id="x"}@else{lang="it"} @@tip(text="{ t }")>{t}</p>',
      '@import {B,A} from "./a"\n\n\n<div><pre>  a\n</pre><!-- c --></div>'
    ])('formats the result of formatting the same way: %s', source => {
      const once = format(source);

      expect(format(once)).toBe(once);
    });
  });
});
