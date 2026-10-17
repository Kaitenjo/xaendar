import { afterEach, describe, expect, it, vi } from 'vitest';
import { Parser } from '../parser/parser/parser';
import { ASTNode } from '../parser/types/ast.type';
import { ASTNodeType } from '../parser/types/node.enum';
import type { CompilerCache } from '../types/compiler-cache.type';
import type { ImportedSymbol } from '../types/imported-symbol/imported-symbol.type';
import { TemplateError } from '../models/template-error/template-error.model';
import { compile, parseTemplate, typeCheckTemplate, typeCheckTemplateTolerant } from './compile';

const component = { type: 'component', selector: 'a-b', properties: new Map(), events: new Map() };
const createCache = () => ({ getOrInsert: vi.fn(async () => component as never), getImport: vi.fn(async () => component as never), set: vi.fn() }) satisfies CompilerCache;

/**
 * A cache resolving every import as a symbol of `/base/utils.ts`, reactive for the given names.
 */
const createSymbolCache = (...reactive: string[]) => ({
  ...createCache(),
  getImport: vi.fn(async (imported: string): Promise<ImportedSymbol> => ({ type: 'symbol', modulePath: '/base/utils.ts', reactive: reactive.includes(imported) }))
}) satisfies CompilerCache;

describe('compile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generates only javascript when no base directory is provided', async () => {
    const result = await compile('hello', { signals: [], cache: createCache() });
    expect(result).toContain('function render() {');
  });

  it('generates only the type-check result when signals are not provided', async () => {
    const cache = createCache();
    const result = await compile('@import { A, default } from \'./a\'\n{heading}', { baseDir: '/base', cache });

    expect(result).toMatchObject({ text: 'function typeCheck() {\n  root.heading;\n}' });
    expect(cache.getImport).toHaveBeenCalledWith('A', 'A', '/base', './a');
    expect(cache.getImport).toHaveBeenCalledWith('default', 'default', '/base', './a');
  });

  it('compiles the custom elements of other libraries matching the customElements patterns like native elements', async () => {
    const template = '<sl-button @if (cond) { variant="primary" } (sl-click)="f($event)"></sl-button>';
    const { javascript, typescript } = await compile(template, { baseDir: '/base', signals: [], customElements: ['sl-*'], cache: createCache() });

    expect(javascript).toContain('unbind: _removeAttribute');
    expect(typescript.text).toContain('let $event!: (HTMLElementEventMap extends { \'sl-click\': infer Event } ? Event : any);');
    await expect(compile(template, { signals: [], customElements: ['sl-*'], cache: createCache() })).resolves.toContain('unbind: _removeAttribute');
    await expect(compile(template, { baseDir: '/base', customElements: ['sl-*'], cache: createCache() })).resolves.toMatchObject({ text: expect.stringContaining('sl-click') });
  });

  it('generates both outputs when base directory and signals are provided', async () => {
    const result = await compile('{count}', { baseDir: '/base', signals: ['count'], cache: createCache() });

    expect(result).toMatchObject({ javascript: expect.stringContaining('() => this.count'), typescript: { text: expect.stringContaining('root.count;') } });
  });

  it('compiles template literals and strings holding braces, in text and in attributes', async () => {
    const template = '<p title="{ `t ${count}` }">{ `a` + count } { \'}\' } { "{" } { `x ${ `y ${count}` }` }</p>';
    const { javascript, typescript } = await compile(template, { baseDir: '/base', signals: ['count'], cache: createCache() });

    expect(javascript).toContain('value: () => `t ${this.count}`,');
    expect(javascript).toContain('() => `a` + this.count,');
    expect(javascript).toContain('() => \'}\',');
    expect(javascript).toContain('() => "{",');
    expect(javascript).toContain('() => `x ${ `y ${this.count}` }`,');
    expect(typescript.text).toContain('`x ${ `y ${root.count}` }`;');
  });

  it('keeps the space between two interpolations, and drops the whitespace holding a line break', async () => {
    const javascript = await compile('<p>{ first } { second }</p>\n<p>\n  { first }\n  { second }\n</p>', { signals: [], cache: createCache() });

    expect(javascript.match(/_renderLiteralText\([^)]*' '/g)).toHaveLength(1);
  });

  it('keeps the line breaks of a text and decodes the character references of texts and static attribute values', async () => {
    const javascript = await compile('<p title="a &amp; b">one\r\n  two &lt;&#64;&lbrace;</p>', { signals: [], cache: createCache() });

    expect(javascript).toContain('\'one\\n  two <@{\'');
    expect(javascript).toContain('\'a & b\'');
  });

  it('compiles an event handler named like a reserved word, calling it on the component', async () => {
    const { javascript, typescript } = await compile('<button (click)="delete()">x</button>', { baseDir: '/base', signals: [], cache: createCache() });

    expect(javascript).toContain('handler: () => this.delete()');
    expect(typescript.text).toContain('root.delete();');
  });

  it('compiles object literals starting an expression, shorthand properties included', async () => {
    const template = '<p title="{ {count} }">{ {count} } { { a: count }.a }</p>\n@if ({ count }.count) {\n  <i>x</i>\n}';
    const { javascript, typescript } = await compile(template, { baseDir: '/base', signals: ['count'], cache: createCache() });

    expect(javascript).toContain('value: () => ({count: this.count}),');
    expect(javascript).toContain('_renderText(p0, context, () => ({count: this.count}), null);');
    expect(javascript).toContain('_renderText(p0, context, () => ({ a: this.count }.a), null);');
    expect(javascript).toContain('condition: () => ({ count: this.count }.count),');
    expect(typescript.text).toContain('({count: root.count});');
    expect(typescript.text).toContain('if (({ count: root.count }.count)) {');
  });

  it('compiles a tag spanning multiple lines exactly like the same tag on a single line', async () => {
    const lines = ['<div', 'class="a"', 'title="{heading}"', '(click)="onClick($event)"', '@if (dark) {', 'hidden', '} @else {', 'id="light"', '}', '>{count}</div>'];
    const compileBoth = (template: string) => compile(template, { baseDir: '/base', signals: ['count'], cache: createCache() });
    const singleLine = await compileBoth(lines.join(' '));
    const multiLine = await compileBoth(lines.join('\r\n\t'));

    expect(multiLine.javascript).toBe(singleLine.javascript);
    expect(multiLine.typescript.text).toBe(singleLine.typescript.text);
    expect(multiLine.javascript).toContain('name: \'class\',');
    expect(multiLine.typescript.text).toContain('if (root.dark) {');
  });

  it('resolves every specifier, default and namespace ones included, with the name it imports and its local name', async () => {
    const importNode = {
      type: ASTNodeType.Import,
      specifiers: [{ imported: 'default', local: 'D' }, { imported: '*', local: 'ns' }, { imported: 'A', local: 'A' }],
      path: './x'
    };
    vi.spyOn(Parser.prototype, 'parse').mockReturnValue([importNode] as unknown as ASTNode[]);
    const cache = createCache();

    await compile('', { baseDir: '/base', cache });

    expect(cache.getImport.mock.calls).toEqual([['default', 'D', '/base', './x'], ['*', 'ns', '/base', './x'], ['A', 'A', '/base', './x']]);
  });
});

describe('parseTemplate', () => {
  it('tokenises and parses a template into its AST', () => {
    expect(parseTemplate('<b>{x}</b>')).toMatchObject([{ type: ASTNodeType.Element, tagName: 'b', children: [{ type: ASTNodeType.Interpolation }] }]);
  });

  it('throws a TemplateError for a template that cannot be parsed', () => {
    expect(() => parseTemplate('<b>')).toThrow(TemplateError);
  });
});

describe('typeCheckTemplate', () => {
  it('type-checks a parsed template against the given metadata', async () => {
    const template = '<a-b></a-b>{heading}';
    const result = await typeCheckTemplate(template, parseTemplate(template), [component as never]);

    expect(result.text).toBe('function typeCheck() {\n  root.heading;\n}');
  });
});

describe('typeCheckTemplateTolerant', () => {
  it('collects the errors of the nodes failing type-checking', async () => {
    const template = '<a-b></a-b><c-d></c-d>{heading}';
    const { text, errors } = await typeCheckTemplateTolerant(template, parseTemplate(template), [component as never]);

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('c-d selector is not associated');
    expect(text).toBe('function typeCheck() {\n  root.heading;\n}');
  });
});

describe('compile generic directives', () => {
  it('generates the same javascript for a directive declaring type arguments, which only the type-check uses', async () => {
    const withTypeArguments = await compile('<div @@list<string, Map<string, number>>(items="{ rows }")></div>', { signals: [], cache: createCache() });
    const withoutTypeArguments = await compile('<div @@list(items="{ rows }")></div>', { signals: [], cache: createCache() });

    expect(withTypeArguments).toBe(withoutTypeArguments);
  });

  it('generates the same javascript for an element declaring type arguments, which only the type-check uses', async () => {
    const withTypeArguments = await compile('<my-list(string, (value: number) => void) items="{ rows }"><span /></my-list>', { signals: [], cache: createCache() });
    const withoutTypeArguments = await compile('<my-list items="{ rows }"><span /></my-list>', { signals: [], cache: createCache() });

    expect(withTypeArguments).toBe(withoutTypeArguments);
  });
});

describe('compile imported symbols', () => {
  const template = '@import { formatDate, Status, count, Row, track, default as fmt, * as utils } from \'./utils\'\n<p title="{ formatDate(d) }" data-count="{ count() }" (click)="track($event)">{ Status.Active } { utils.x } { fmt(1) }</p>';

  it('imports in the render code, under an alias, only the symbols an expression reads, and reads them through it', async () => {
    const { javascript } = await compile(template, { baseDir: '/base', signals: [], cache: createSymbolCache('count') });

    expect(javascript.split('\n').slice(0, 6)).toEqual([
      'import { formatDate as __import_formatDate } from \'/base/utils.ts\';',
      'import { Status as __import_Status } from \'/base/utils.ts\';',
      'import { count as __import_count } from \'/base/utils.ts\';',
      'import { track as __import_track } from \'/base/utils.ts\';',
      'import { default as __import_fmt } from \'/base/utils.ts\';',
      'import * as __import_utils from \'/base/utils.ts\';'
    ]);
    // A type is not a value at runtime
    expect(javascript).not.toContain('Row');
    expect(javascript).toContain('value: () => __import_formatDate(this.d),\n        setter: _setExpressionProperty');
    // A symbol reading a signal makes the binding reactive
    expect(javascript).toContain('value: () => __import_count(),\n        setter: _setReactiveProperty');
    expect(javascript).toContain('handler: ($event) => __import_track($event)');
    expect(javascript).toContain('() => __import_Status.Active');
    expect(javascript).toContain('() => __import_utils.x');
  });

  it('imports every symbol in the type-check code under its own name, mapped onto the template, and reads it as written', async () => {
    const { typescript } = await compile(template, { baseDir: '/base', signals: [], cache: createSymbolCache() });
    const lines = typescript.text.split('\n');

    expect(lines.slice(0, 8)).toEqual([
      'import { formatDate } from \'/base/utils\';',
      'import { Status } from \'/base/utils\';',
      'import { count } from \'/base/utils\';',
      'import { Row } from \'/base/utils\';',
      'import { track } from \'/base/utils\';',
      'import { default as fmt } from \'/base/utils\';',
      'import * as utils from \'/base/utils\';',
      'function typeCheck() {'
    ]);
    expect(typescript.mappingTable.get(5)!.map(({ original }) => template.slice(original.start, original.end))).toEqual(['default', 'fmt']);
    expect(typescript.mappingTable.get(6)!.map(({ original }) => template.slice(original.start, original.end))).toEqual(['utils']);
    expect(lines).toContain('  formatDate(root.d);');
    expect(lines).toContain('    track($event);');
    expect(lines).toContain('  Status.Active;');
  });

  it('reads a variable of the template rather than a symbol named like it, and a symbol rather than a global named like it', async () => {
    const source = '@import { item, Map } from \'./utils\'\n@for (item of items; track item()) { {item} } { Map.size }';
    const { javascript } = await compile(source, { baseDir: '/base', signals: [], cache: createSymbolCache() });

    expect(javascript).toContain('context.get(\'item\')');
    expect(javascript).not.toContain('__import_item');
    expect(javascript).toContain('() => __import_Map.size');
  });

  it('resolves the imports of the JavaScript code against templateDir, and leaves them unresolved without it', async () => {
    const source = '@import { formatDate } from \'./utils\'\n{ formatDate(d) }';

    await expect(compile(source, { signals: [], templateDir: '/base', cache: createSymbolCache() })).resolves.toContain('() => __import_formatDate(this.d)');
    await expect(compile(source, { signals: [], cache: createSymbolCache() })).resolves.toContain('() => this.formatDate(this.d)');
  });

  it.each(['root', '$event', '__probe'])('rejects a symbol imported as %s, a name the generated code reserves', async name => {
    const source = `@import { x as ${name} } from './utils'`;

    await expect(compile(source, { baseDir: '/base', cache: createSymbolCache() })).rejects.toThrow(`"${name}" is reserved in templates`);
    await expect(compile(source, { signals: [], templateDir: '/base', cache: createSymbolCache() })).rejects.toThrow(`"${name}" is reserved in templates`);
  });
});
