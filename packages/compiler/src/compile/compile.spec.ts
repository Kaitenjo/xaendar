import { afterEach, describe, expect, it, vi } from 'vitest';
import { Parser } from '../parser/parser/parser';
import { ASTNode } from '../parser/types/ast.type';
import { ASTNodeType } from '../parser/types/node.enum';
import type { CompilerCache } from '../types/compiler-cache.type';
import { compile } from './compile';

const component = { type: 'component', selector: 'a-b', properties: new Map(), events: new Map() };
const createCache = () => ({ getOrInsert: vi.fn(async () => component as never), set: vi.fn() }) satisfies CompilerCache;

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
    const result = await compile('@import { A, default } from \'./a\'\n{name}', { baseDir: '/base', cache });

    expect(result).toMatchObject({ text: 'function typeCheck() {\n  root.name;\n}' });
    expect(cache.getOrInsert).toHaveBeenCalledWith('A', ['/base', './a']);
    expect(cache.getOrInsert).toHaveBeenCalledWith('default', ['/base', './a']);
  });

  it('generates both outputs when base directory and signals are provided', async () => {
    const result = await compile('{count}', { baseDir: '/base', signals: ['count'], cache: createCache() });

    expect(result).toMatchObject({ javascript: expect.stringContaining('() => this.count'), typescript: { text: expect.stringContaining('root.count;') } });
  });

  it('compiles a tag spanning multiple lines exactly like the same tag on a single line', async () => {
    const lines = ['<div', 'class="a"', 'title="{name}"', '(click)="onClick($event)"', '@if (dark) {', 'hidden', '} @else {', 'id="light"', '}', '>{count}</div>'];
    const compileBoth = (template: string) => compile(template, { baseDir: '/base', signals: ['count'], cache: createCache() });
    const singleLine = await compileBoth(lines.join(' '));
    const multiLine = await compileBoth(lines.join('\r\n\t'));

    expect(multiLine.javascript).toBe(singleLine.javascript);
    expect(multiLine.typescript.text).toBe(singleLine.typescript.text);
    expect(multiLine.javascript).toContain('name: \'class\',');
    expect(multiLine.typescript.text).toContain('if (root.dark) {');
  });

  it('resolves default imports through their local name and skips namespace imports', async () => {
    const importNode = {
      type: ASTNodeType.Import,
      specifiers: [{ imported: 'default', local: 'D' }, { imported: '*', local: 'ns' }, { imported: 'A', local: 'A' }],
      path: './x'
    };
    vi.spyOn(Parser.prototype, 'parse').mockReturnValue([importNode] as unknown as ASTNode[]);
    const cache = createCache();

    await compile('', { baseDir: '/base', cache });

    expect(cache.getOrInsert.mock.calls.map(([name]) => name)).toEqual(['D', 'A']);
  });
});
