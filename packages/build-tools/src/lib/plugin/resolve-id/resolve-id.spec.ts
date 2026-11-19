import type { PluginContext } from 'rolldown';
import { describe, expect, it, vi } from 'vitest';
import { createResolveIdHook } from './resolve-id';

describe('createResolveIdHook()', () => {
  const resolve = vi.fn(async (source: string, importer?: string) => ({ id: `${importer}:${source}` }));
  const resolveId = (source: string, importer?: string) => createResolveIdHook().call({ resolve } as unknown as PluginContext, source, importer, {} as never);

  it('resolves a template module specifier to a virtual module id', () => {
    expect(resolveId('virtual:xaendar-template:/foo.html?signals=&lang.js')).toBe('\0virtual:xaendar-template:/foo.html?signals=&lang.js');
  });

  it('resolves a style module specifier to a virtual module id', () => {
    expect(resolveId('virtual:xaendar-style?path=%2Ffoo.css&lang.js')).toBe('\0virtual:xaendar-style?path=%2Ffoo.css&lang.js');
  });

  it('resolves what a template module imports as imported by the template', async () => {
    expect(await resolveId('@acme/format', '\0virtual:xaendar-template:/src/foo.html?signals=&lang.js')).toEqual({ id: '/src/foo.html:@acme/format' });
    expect(resolve).toHaveBeenCalledWith('@acme/format', '/src/foo.html', { skipSelf: true });
  });

  it('ignores every other specifier', () => {
    expect(resolveId('./foo.xd.component')).toBeNull();
    expect(resolveId('@acme/format', '/src/foo.xd.component.ts')).toBeNull();
  });
});
