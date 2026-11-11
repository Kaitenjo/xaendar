import type { ContextCache } from '@xaendar/compiler';
import { describe, expect, it, vi } from 'vitest';
import { compileServer } from './compile-server';

/**
 * A cache resolving every import to a symbol of the same module.
 */
const createCache = () => ({
  getImport: vi.fn(async () => ({ type: 'symbol' as const, modulePath: '/src/format.ts', reactive: false }))
}) as unknown as ContextCache & { getImport: ReturnType<typeof vi.fn> };

describe('compileServer', () => {
  it('compiles a template into the code rendering it on the server', async () => {
    const code = await compileServer('<p>{ title() }</p>', { signals: ['title'], cache: createCache() });

    expect(code).toContain('out.push(\'<p><!---->\' + _escapeText(this.title()) + \'</p>\');');
  });

  it('writes nothing of the casts, which only the type-check reads', async () => {
    const code = await compileServer('<p title="{ title() as string }" (click)="pick($event as MouseEvent)">{ count() as number }</p>', { signals: ['title', 'count'], cache: createCache() });

    expect(code).not.toContain(' as ');
    expect(code).toContain('_escapeText(this.count())');
  });

  it('resolves the symbols the template imports relative to its directory, importing the ones an expression reads', async () => {
    const cache = createCache();
    const code = await compileServer('@import { format } from \'./format\';\n<p>{ format(1) }</p>', { signals: [], templateDir: '/src', cache });

    expect(cache.getImport).toHaveBeenCalledWith('format', 'format', '/src', './format');
    expect(code).toContain('import { format as __import_format } from \'/src/format.ts\';');
    expect(code).toContain('_escapeText(__import_format(1))');
  });

  it('writes the components the template imports rendering only in the browser through _ssrClientComponent', async () => {
    const metadata = { type: 'component', selector: 'x-map', clientOnly: {}, properties: new Map() };
    const other = { type: 'component', selector: 'x-card', properties: new Map() };
    const directive = { type: 'directive', selector: 'tip', properties: new Map() };
    const exportsByName: Record<string, unknown> = { Map: metadata, Card: other, Tip: directive };
    const cache = { getImport: vi.fn(async (imported: string) => exportsByName[imported]) } as unknown as ContextCache;
    const code = await compileServer('@import { Map } from \'./map\';\n@import { Card } from \'./card\';\n@import { Tip } from \'./tip\';\n<x-map></x-map><x-card></x-card>', { signals: [], templateDir: '/src', cache });

    expect(code).toContain('const x_map3$element = { tagName: \'x-map\' };');
    expect(code).toContain('_ssrClientComponent(out, context, x_map3$element, x_map3$client);');
    expect(code).toContain('const x_card4$element = { tagName: \'x-card\' };');
    expect(code).toContain('_ssrComponent(out, context, x_card4$element);');
  });

  it('reads every name from the component without the directory of the template', async () => {
    const cache = createCache();
    const code = await compileServer('@import { format } from \'./format\';\n<p>{ format(1) }</p>', { signals: [], cache });

    expect(cache.getImport).not.toHaveBeenCalled();
    expect(code).toContain('_escapeText(this.format(1))');
  });
});
