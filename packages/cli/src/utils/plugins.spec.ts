import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@rolldown/plugin-babel', () => ({
  default: vi.fn((options: unknown) => ({ name: 'babel', options }))
}));

vi.mock('@xaendar/build-tools', () => ({
  xaendarPlugin: vi.fn(() => ({ name: 'xaendar' }))
}));

beforeEach(() => {
  vi.resetModules();
});

/**
 * Imports `plugins.ts` afresh, together with the mocks it uses.
 */
async function load() {
  const { default: babel } = await import('@rolldown/plugin-babel');
  const { xaendarPlugin } = await import('@xaendar/build-tools');
  const { PLUGINS } = await import('./plugins');

  return { babel, xaendarPlugin, PLUGINS };
}

describe('PLUGINS', () => {
  it('contains the babel plugin followed by the xaendar plugin', async () => {
    const { PLUGINS, xaendarPlugin } = await load();

    expect(PLUGINS).toHaveLength(2);
    expect(PLUGINS.map(plugin => (plugin as { name: string }).name)).toEqual(['babel', 'xaendar']);
    expect(xaendarPlugin).toHaveBeenCalledTimes(1);
  });

  it('configures babel with the decorators preset, filtered on "@"', async () => {
    const { babel } = await load();
    const babelCall = vi.mocked(babel).mock.calls[0][0] as {
      presets: [{ preset: () => { plugins: unknown[] }, rolldown: { filter: { code: string } } }]
    };
    const [presetEntry] = babelCall.presets;

    expect(presetEntry.preset()).toEqual({
      plugins: [['@babel/plugin-proposal-decorators', { version: '2023-11' }]]
    });
    expect(presetEntry.rolldown.filter.code).toBe('@');
  });
});
