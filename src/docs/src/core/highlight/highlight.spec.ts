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
      'dec:@Property', 'br1:(', 'br1:)', 'kw:public', 'kw:accessor', 'var:n', 'op:=', 'fn:signal', 'br1:<', 'prim:number', 'br1:>', 'br1:(',
      'num:1', 'br1:)', 'com:// x', 'kw:const', 'const:s', 'op:=', 'str:\'a\'', 'kw:this', 'member:items', 'fn:update', 'br1:(', 'param:x',
      'op:=>', 'var:x', 'br1:)'
    ]);
  });

  it('highlights calls, types and keywords used as property names', () => {
    expect(tokens(highlight('new Foo().default.run()', 'ts'))).toEqual(['kw:new', 'type:Foo', 'br1:(', 'br1:)', 'member:default', 'fn:run', 'br1:(', 'br1:)']);
  });

  it('tells parameters, constants, primitive types and types apart, as VS Code does', () => {
    const code = `import { load } from 'x';\nconst { render } = await import('y');\nexport function page(url: string): Promise<string> {\n  return render(App);\n}`;
    expect(tokens(highlight(code, 'ts'))).toEqual([
      'kw:import', 'br1:{', 'var:load', 'br1:}', 'kw:from', 'str:\'x\'', 'kw:const', 'br1:{', 'const:render', 'br1:}', 'op:=', 'kw:await',
      'kw:import', 'br1:(', 'str:\'y\'', 'br1:)', 'kw:export', 'kw:function', 'fn:page', 'br1:(', 'param:url', 'op::', 'prim:string', 'br1:)',
      'op::', 'type:Promise', 'br1:<', 'prim:string', 'br1:>', 'br1:{', 'kw:return', 'fn:render', 'br2:(', 'var:App', 'br2:)', 'br1:}'
    ]);
  });

  it('highlights the members, the parameters and the types of a class', () => {
    const code = `class A<T> extends B implements C {\n  public readonly count = signal(0);\n  public value?: Map<string, T[]>;\n  constructor(private store: Store, name = 'x') {}\n  public get label(): void {}\n}`;
    expect(tokens(highlight(code, 'ts')).filter(item => !item.startsWith('br'))).toEqual([
      'kw:class', 'type:A', 'type:T', 'kw:extends', 'type:B', 'kw:implements', 'type:C', 'kw:public', 'kw:readonly', 'field:count', 'op:=',
      'fn:signal', 'num:0', 'kw:public', 'field:value', 'op:?', 'op::', 'type:Map', 'prim:string', 'type:T', 'kw:constructor', 'kw:private',
      'param:store', 'op::', 'type:Store', 'param:name', 'op:=', 'str:\'x\'', 'kw:public', 'kw:get', 'fn:label', 'op::', 'prim:void'
    ]);
  });

  it('tells the declaration of a field, the key of an object and the access to a property apart', () => {
    const code = 'class A {\n  private readonly _tip = document.body;\n  public show(): void {\n    this._tip.style.left = { top: box.top };\n  }\n}';
    expect(tokens(highlight(code, 'ts')).filter(item => /^(field|key|member):/.test(item))).toEqual([
      'field:_tip', 'member:body', 'member:_tip', 'member:style', 'member:left', 'key:top', 'member:top'
    ]);
  });

  it('highlights interfaces, type aliases and the types following as', () => {
    const code = `interface P<T = string> extends Q { a: number; b?(x: T): void; c: keyof typeof obj }\ntype F = (v: string) => boolean;\nconst z = y as unknown as Z;`;
    expect(tokens(highlight(code, 'ts')).filter(item => !item.startsWith('br'))).toEqual([
      'kw:interface', 'type:P', 'type:T', 'op:=', 'prim:string', 'kw:extends', 'type:Q', 'field:a', 'op::', 'prim:number', 'fn:b', 'op:?',
      'param:x', 'op::', 'type:T', 'op::', 'prim:void', 'field:c', 'op::', 'kw:keyof', 'kw:typeof', 'var:obj', 'kw:type', 'type:F', 'op:=',
      'param:v', 'op::', 'prim:string', 'op:=>', 'prim:boolean', 'kw:const', 'const:z', 'op:=', 'var:y', 'kw:as', 'prim:unknown', 'kw:as', 'type:Z'
    ]);
  });

  it('highlights destructured parameters, arrow functions and type predicates', () => {
    const code = `const add = ({ a, b: c }: P, ...rest: number[]): number => a;\nfunction is(value: unknown): value is R {}`;
    expect(tokens(highlight(code, 'ts')).filter(item => !item.startsWith('br'))).toEqual([
      'kw:const', 'fn:add', 'op:=', 'param:a', 'key:b', 'param:c', 'op::', 'type:P', 'op:...', 'param:rest', 'op::', 'prim:number', 'op::',
      'prim:number', 'op:=>', 'var:a', 'kw:function', 'fn:is', 'param:value', 'op::', 'prim:unknown', 'op::', 'param:value', 'kw:is', 'type:R'
    ]);
  });

  it('draws the colon of an object literal as plain punctuation, and a ternary one as an operator', () => {
    expect(tokens(highlight('const o = { kind: a ? b : c, run() {} };', 'ts')).filter(item => !item.startsWith('br'))).toEqual([
      'kw:const', 'const:o', 'op:=', 'key:kind', 'var:a', 'op:?', 'var:b', 'op::', 'var:c', 'fn:run'
    ]);
  });

  it('colors the brackets by their depth', () => {
    expect(tokens(highlight('f([{ a: (1) }])', 'ts')).filter(item => item.startsWith('br'))).toEqual([
      'br1:(', 'br2:[', 'br3:{', 'br1:(', 'br1:)', 'br3:}', 'br2:]', 'br1:)'
    ]);
  });

  it('highlights the expressions of template literals, regular expressions and comparisons', () => {
    expect(tokens(highlight('const t = `a ${x + 1} b`; const r = /[<>]/g; i<n;', 'ts'))).toEqual([
      'kw:const', 'const:t', 'op:=', 'str:`a ', 'kw:${', 'var:x', 'op:+', 'num:1', 'kw:}', 'str: b`', 'kw:const', 'const:r', 'op:=',
      'str:/[<>]/g', 'var:i', 'op:<', 'var:n'
    ]);
  });

  it('highlights the tags of JSDoc comments and the names of the parameters', () => {
    expect(tokens(highlight('/**\n * Text.\n *\n * @param name - The name.\n * @returns The @value.\n */', 'ts'))).toEqual([
      'com:/**\n * Text.\n *\n * ', 'kw:@param', 'com: ', 'var:name', 'com: - The name.\n * ', 'kw:@returns', 'com: The @value.\n */'
    ]);
  });

  it('highlights the template syntax', () => {
    expect(tokens(highlight(`<b class="x" title="{ tip() }" (click)="go($event)" @@tip(text="a") *when(ok="{ok}") disabled />`, 'html'))).toEqual([
      'punc:<', 'tag:b', 'attr:class', 'punc:=', 'str:"x"', 'attr:title', 'punc:=', 'punc:"', 'interp:{', 'fn:tip', 'br1:(', 'br1:)', 'interp:}', 'punc:"',
      'evt:(click)', 'punc:=', 'punc:"', 'fn:go', 'br1:(', 'var:$event', 'br1:)', 'punc:"', 'dir:@@tip', 'punc:(', 'attr:text', 'punc:=', 'str:"a"',
      'punc:)', 'dir:*when', 'punc:(', 'attr:ok', 'punc:=', 'punc:"', 'interp:{', 'var:ok', 'interp:}', 'punc:"', 'punc:)', 'attr:disabled', 'punc:/>'
    ]);
  });

  it('highlights control flow and interpolations', () => {
    expect(tokens(highlight(`@if (ready()) {\n<i>{ label }</i>\n} @else {\n}`, 'html'))).toEqual([
      'ctl:@if', 'punc:(', 'fn:ready', 'br1:(', 'br1:)', 'punc:)', 'punc:{', 'punc:<', 'tag:i', 'punc:>', 'interp:{', 'var:label', 'interp:}', 'punc:</', 'tag:i', 'punc:>',
      'punc:}', 'ctl:@else', 'punc:{', 'punc:}'
    ]);
  });

  it('highlights a @client and its @placeholder like the other blocks', () => {
    expect(tokens(highlight('@client {\n} @placeholder {\n}', 'html'))).toEqual(['ctl:@client', 'punc:{', 'punc:}', 'ctl:@placeholder', 'punc:{', 'punc:}']);
  });

  it('highlights a @hydrate like the other blocks', () => {
    expect(tokens(highlight('@hydrate (idle) {\n}', 'html'))).toEqual(['ctl:@hydrate', 'punc:(', 'var:idle', 'punc:)', 'punc:{', 'punc:}']);
  });

  it('highlights conditional bindings inside a tag', () => {
    expect(tokens(highlight(`<a @if (linked()) { href="/home" } @else { (click)="edit()" }>`, 'html'))).toEqual([
      'punc:<', 'tag:a', 'ctl:@if', 'punc:(', 'fn:linked', 'br1:(', 'br1:)', 'punc:)', 'punc:{', 'attr:href', 'punc:=', 'str:"/home"', 'punc:}',
      'ctl:@else', 'punc:{', 'evt:(click)', 'punc:=', 'punc:"', 'fn:edit', 'br1:(', 'br1:)', 'punc:"', 'punc:}', 'punc:>'
    ]);
  });

  it('highlights the type arguments following the name of a tag', () => {
    expect(tokens(highlight(`<ex-picker(Row, number) items="a" /></ex-picker>`, 'html'))).toEqual([
      'punc:<', 'tag:ex-picker', 'punc:(', 'type:Row', 'prim:number', 'punc:)', 'attr:items', 'punc:=', 'str:"a"', 'punc:/>', 'punc:</', 'tag:ex-picker', 'punc:>'
    ]);
  });

  it('highlights imports and comments in templates', () => {
    expect(tokens(highlight(`@import { Card } from './card.ts'\n<!-- note -->`, 'html'))).toEqual(['ctl:@import', 'br1:{', 'var:Card', 'br1:}', 'kw:from', 'str:\'./card.ts\'', 'com:<!-- note -->']);
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

  it('highlights the code of a file saved with CRLF line breaks as the same code with LF ones', () => {
    for (const [lang, code] of SAMPLES) {
      expect(highlight(code.replaceAll('\n', '\r\n'), lang)).toBe(highlight(code, lang));
    }
  });

  it('tolerates unterminated constructs', () => {
    for (const code of ['<div title="{ a', '{ a(', '@if (a', `'abc`, '/* x', '<!-- x']) {
      expect(() => highlight(code, 'html')).not.toThrow();
      expect(() => highlight(code, 'ts')).not.toThrow();
      expect(() => highlight(code, 'css')).not.toThrow();
    }
  });
});
