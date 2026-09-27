import { createServer } from 'vite';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('vite', () => ({
  createServer: vi.fn()
}));

vi.mock('@rolldown/plugin-babel', () => ({
  default: vi.fn((options: unknown) => ({ name: 'babel', options }))
}));

vi.mock('@xaendar/build-tools', () => ({
  xaendarPlugin: vi.fn(() => ({ name: 'xaendar' }))
}));

import babel from '@rolldown/plugin-babel';
import { xaendarPlugin } from '@xaendar/build-tools';
import { startCommand } from './start.command';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('startCommand()', () => {
  it('registers the "start" command with its "s" alias', () => {
    const command = startCommand();

    expect(command.name()).toBe('start');
    expect(command.aliases()).toContain('s');
  });

  it('creates and starts a vite dev server with the babel and xaendar plugins', async () => {
    const listen = vi.fn().mockResolvedValue(undefined);
    vi.mocked(createServer).mockResolvedValue({ listen } as unknown as Awaited<ReturnType<typeof createServer>>);
    const command = startCommand();

    await command.parseAsync([], { from: 'user' });

    expect(createServer).toHaveBeenCalledTimes(1);
    const [config] = vi.mocked(createServer).mock.calls[0] as [{ plugins: unknown[] }];
    expect(config.plugins).toHaveLength(2);
    expect(xaendarPlugin).toHaveBeenCalled();
    expect(listen).toHaveBeenCalledTimes(1);

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
