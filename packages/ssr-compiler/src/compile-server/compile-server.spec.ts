import type { CompilerCache } from '@xaendar/compiler';
import { describe, expect, it, vi } from 'vitest';
import { compileServer } from './compile-server';

/**
 * A cache resolving every import to a symbol of the same module.
 */
const createCache = () => ({
  getImport: vi.fn(async () => ({ type: 'symbol' as const, modulePath: '/src/format.ts', reactive: false }))
}) as unknown as CompilerCache & { getImport: ReturnType<typeof vi.fn> };

describe('compileServer', () => {
  it('compiles a template into the code rendering it on the server', async () => {
    const code = await compileServer('<p>{ title() }</p>', { signals: ['title'], cache: createCache() });

    expect(code).toContain('out.push(\'<p>\' + _escapeText(this.title()) + \'</p>\');');
  });

  it('resolves the symbols the template imports relative to its directory, importing the ones an expression reads', async () => {
    const cache = createCache();
    const code = await compileServer('@import { format } from \'./format\';\n<p>{ format(1) }</p>', { signals: [], templateDir: '/src', cache });

    expect(cache.getImport).toHaveBeenCalledWith('format', 'format', '/src', './format');
    expect(code).toContain('import { format as __import_format } from \'/src/format.ts\';');
    expect(code).toContain('_escapeText(__import_format(1))');
  });

  it('reads every name from the component without the directory of the template', async () => {
    const cache = createCache();
    const code = await compileServer('@import { format } from \'./format\';\n<p>{ format(1) }</p>', { signals: [], cache });

    expect(cache.getImport).not.toHaveBeenCalled();
    expect(code).toContain('_escapeText(this.format(1))');
  });
});
