import babel from '@rolldown/plugin-babel';
import { describe, expect, it, vi } from 'vitest';
import { importBabelHelpers } from '../babel-helpers/babel-helpers.utils';
import { createBabelPlugin } from './babel-plugin.utils';

vi.mock('@rolldown/plugin-babel', () => ({
  default: vi.fn((options: unknown) => ({ name: 'babel', options }))
}));

describe('createBabelPlugin()', () => {
  it('creates the babel plugin followed by the plugin of its helpers', () => {
    const plugins = createBabelPlugin() as Array<{ name: string }>;

    expect(plugins.map(plugin => plugin.name)).toEqual(['babel', 'xaendar:babel-helpers']);
  });

  it('configures babel with the decorators preset importing its helpers, filtered on "@"', () => {
    vi.mocked(babel).mockClear();
    createBabelPlugin();
    const babelCall = vi.mocked(babel).mock.calls[0][0] as {
      presets: [{ preset: () => { plugins: unknown[] }, rolldown: { filter: { code: string } } }]
    };
    const [presetEntry] = babelCall.presets;

    expect(presetEntry.preset()).toEqual({
      plugins: [['@babel/plugin-proposal-decorators', { version: '2023-11' }], importBabelHelpers]
    });
    expect(presetEntry.rolldown.filter.code).toBe('@');
  });
});
