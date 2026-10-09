import { describe, expect, it } from 'vitest';
import { highlight } from './highlight';

/**
 * Removes the highlighting markup and decodes the escaped characters.
 */
const plain = (html: string): string => html.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');

/**
 * Lists the highlighted tokens as `class:text` pairs.
 */
const tokens = (html: string): string[] => [...html.matchAll(/<span class="tok-(\w+)">([^<]*)<\/span>/g)].map(([, cls, text]) => `${cls}:${plain(text ?? '')}`);

const SAMPLES: Array<[Parameters<typeof highlight>[1], string]> = [
  ['ts', `import { signal } from '@xaendar/core/signals';\n@WebComponent({ selector: 'x-a' })\nexport class A extends CustomElement {\n  // comment\n  public readonly count = signal(0x1F);\n  /* block */ s = \`t \${1}\`;\n}`],
  ['html', `@import { Card } from './card.ts'\n<!-- c -->\n<div class="a" title="{ x() }" (click)="go($event)" @@tip(text="{t}") *when(ok="{ok()}") @if (a()) { hidden } disabled />\n@for (i of items(); track i.id) {\n  <li>{ i.name } & <b>x</b></li>\n} @empty`],
  ['css', `:host { display: block; }\n@media (min-width: 600px) {\n  .a:hover > b { color: #fff !important; width: calc(100% - 2px); --x: 1em; }\n}\n/* c */ a::after { content: "}"; }`],
  ['json', `{ "a": 1, "b": [true, null, "x<y"], "c": -2.5e3 }`],
  ['bash', `npm i -D @xaendar/core # install\nxd new my-app --style css\n$ echo "hi" 'there'`],
  ['text', `<b>a & b</b>`]
];

describe('highlight', () => {
  it.each(SAMPLES)('keeps the %s code unchanged once the markup is removed', (lang, code) => {
    expect(plain(highlight(code, lang))).toBe(code);
  });

  it.each(SAMPLES)('escapes the %s code', (lang, code) => {
    expect(highlight(code, lang).replace(/<\/?span[^>]*>/g, '')).not.toMatch(/<|>/);
  });

  it('highlights TypeScript', () => {
    expect(tokens(highlight(`@Property() public accessor n = signal<number>(1); // x\nconst s = 'a';\nthis.items.update(x => x);`, 'ts'))).toEqual([
      'dec:@Property', 'kw:public', 'kw:accessor', 'kw:number', 'num:1', 'com:// x', 'kw:const', 'str:\'a\'', 'kw:this', 'fn:update'
    ]);
  });

  it('highlights calls, types and keywords used as property names', () => {
    expect(tokens(highlight('new Foo().default.run()', 'ts'))).toEqual(['kw:new', 'fn:Foo', 'fn:run']);
  });

  it('highlights the template syntax', () => {
    expect(tokens(highlight(`<b class="x" title="{ tip() }" (click)="go($event)" @@tip(text="a") *when(ok="{ok}") disabled />`, 'html'))).toEqual([
      'punc:<', 'tag:b', 'attr:class', 'punc:=', 'str:"x"', 'attr:title', 'punc:=', 'punc:"', 'interp:{', 'fn:tip', 'interp:}', 'punc:"',
      'evt:(click)', 'punc:=', 'punc:"', 'fn:go', 'punc:"', 'dir:@@tip', 'punc:(', 'attr:text', 'punc:=', 'str:"a"', 'punc:)',
      'dir:*when', 'punc:(', 'attr:ok', 'punc:=', 'punc:"', 'interp:{', 'interp:}', 'punc:"', 'punc:)', 'attr:disabled', 'punc:/>'
    ]);
  });

  it('highlights control flow and interpolations', () => {
    expect(tokens(highlight(`@if (ready()) {\n<i>{ label }</i>\n} @else {\n}`, 'html'))).toEqual([
      'ctl:@if', 'punc:(', 'fn:ready', 'punc:)', 'punc:{', 'punc:<', 'tag:i', 'punc:>', 'interp:{', 'interp:}', 'punc:</', 'tag:i', 'punc:>',
      'punc:}', 'ctl:@else', 'punc:{', 'punc:}'
    ]);
  });

  it('highlights conditional bindings inside a tag', () => {
    expect(tokens(highlight(`<a @if (linked()) { href="/home" } @else { (click)="edit()" }>`, 'html'))).toEqual([
      'punc:<', 'tag:a', 'ctl:@if', 'punc:(', 'fn:linked', 'punc:)', 'punc:{', 'attr:href', 'punc:=', 'str:"/home"', 'punc:}',
      'ctl:@else', 'punc:{', 'evt:(click)', 'punc:=', 'punc:"', 'fn:edit', 'punc:"', 'punc:}', 'punc:>'
    ]);
  });

  it('highlights imports and comments in templates', () => {
    expect(tokens(highlight(`@import { Card } from './card.ts'\n<!-- note -->`, 'html'))).toEqual(['ctl:@import', 'type:Card', 'kw:from', 'str:\'./card.ts\'', 'com:<!-- note -->']);
  });

  it('highlights CSS', () => {
    expect(tokens(highlight(`@media (width > 1px) { :host { color: #fff; margin: calc(1px + 2em) !important; } }`, 'css'))).toEqual([
      'kw:@media', 'num:1px', 'punc:{', 'sel::host', 'punc:{', 'prop:color', 'num:#fff', 'prop:margin', 'fn:calc', 'num:1px', 'num:2em', 'kw:!important', 'punc:}', 'punc:}'
    ]);
  });

  it('highlights JSON', () => {
    expect(tokens(highlight(`{ "a": "b", "c": [1, true] }`, 'json'))).toEqual(['attr:"a"', 'str:"b"', 'attr:"c"', 'num:1', 'kw:true']);
  });

  it('highlights shell commands', () => {
    expect(tokens(highlight(`xd new app -s css # go`, 'bash'))).toEqual(['fn:xd', 'attr:-s', 'com:# go']);
  });

  it('tolerates unterminated constructs', () => {
    for (const code of ['<div title="{ a', '{ a(', '@if (a', `'abc`, '/* x', '<!-- x']) {
      expect(() => highlight(code, 'html')).not.toThrow();
      expect(() => highlight(code, 'ts')).not.toThrow();
      expect(() => highlight(code, 'css')).not.toThrow();
    }
  });
});
