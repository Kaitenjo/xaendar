import type { PluginContext } from 'rolldown';
import { describe, expect, it } from 'vitest';
import { createResolveIdHook } from './resolve-id';

describe('createResolveIdHook()', () => {
  const resolveId = (source: string) => createResolveIdHook().call({} as PluginContext, source, undefined, {} as never);

  it('resolves a template module specifier to a virtual module id', () => {
    expect(resolveId('virtual:xaendar-template:/foo.html?signals=&lang.js')).toBe('\0virtual:xaendar-template:/foo.html?signals=&lang.js');
  });

  it('ignores every other specifier', () => {
    expect(resolveId('./foo.xd.component')).toBeNull();
  });
});
