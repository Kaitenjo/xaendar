import babel from '@rolldown/plugin-babel';
import { xaendarPlugin } from '@xaendar/build-tools';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPlugins } from './plugins';

vi.mock('@rolldown/plugin-babel', () => ({
  default: vi.fn((options: unknown) => ({ name: 'babel', options }))
}));

vi.mock('@xaendar/build-tools', () => ({
  xaendarPlugin: vi.fn(() => ({ name: 'xaendar' }))
}));

/**
 * Temporary project directory the plugins are created from.
 */
let projectDir: string;

beforeEach(() => {
  vi.clearAllMocks();
  projectDir = mkdtempSync(join(tmpdir(), 'xaendar-plugins-'));
  vi.spyOn(process, 'cwd').mockReturnValue(projectDir);
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(projectDir, { recursive: true, force: true });
});

describe('createPlugins()', () => {
  it('creates the babel plugin followed by the xaendar plugin', () => {
    const plugins = createPlugins();

    expect(plugins.map(plugin => (plugin as { name: string }).name)).toEqual(['babel', 'xaendar']);
    expect(xaendarPlugin).toHaveBeenCalledTimes(1);
  });

  it('configures babel with the decorators preset, filtered on "@"', () => {
    createPlugins();
    const babelCall = vi.mocked(babel).mock.calls[0][0] as {
      presets: [{ preset: () => { plugins: unknown[] }, rolldown: { filter: { code: string } } }]
    };
    const [presetEntry] = babelCall.presets;

    expect(presetEntry.preset()).toEqual({
      plugins: [['@babel/plugin-proposal-decorators', { version: '2023-11' }]]
    });
    expect(presetEntry.rolldown.filter.code).toBe('@');
  });

  it('passes the custom elements declared in the xaendar.json of the project to the xaendar plugin', () => {
    writeFileSync(join(projectDir, 'xaendar.json'), JSON.stringify({ name: 'app', customElements: ['sl-*'] }));
    createPlugins();

    expect(xaendarPlugin).toHaveBeenCalledWith({ customElements: ['sl-*'] });
  });

  it('passes no custom elements when xaendar.json declares none or is missing', () => {
    createPlugins();
    writeFileSync(join(projectDir, 'xaendar.json'), JSON.stringify({ name: 'app' }));
    createPlugins();

    expect(vi.mocked(xaendarPlugin).mock.calls).toEqual([[{ customElements: [] }], [{ customElements: [] }]]);
  });
});
