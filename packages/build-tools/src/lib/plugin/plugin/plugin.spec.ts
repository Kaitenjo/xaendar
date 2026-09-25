import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@xaendar/language-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xaendar/language-core')>();
  return {
    ...actual,
    loadCompilerOptions: vi.fn()
  };
});

vi.mock('../configure-server/configure-server', () => ({
  createConfigureServerHook: vi.fn()
}));

vi.mock('../transform/transform', () => ({
  createTransformHook: vi.fn()
}));

vi.mock('../watch-change/watch-change', () => ({
  createWatchChangeHook: vi.fn()
}));

import { loadCompilerOptions } from '@xaendar/language-core';
import { NodeCompilerHost } from '../../models/node-compiler-host/node-compiler-host.model';
import { createConfigureServerHook } from '../configure-server/configure-server';
import { createTransformHook } from '../transform/transform';
import { createWatchChangeHook } from '../watch-change/watch-change';
import { xaendarPlugin } from './plugin';

let transformHook: NonNullable<ReturnType<typeof createTransformHook>>;
let watchChangeHook: NonNullable<ReturnType<typeof createWatchChangeHook>>;
let configureServerHook: NonNullable<ReturnType<typeof createConfigureServerHook>>;

beforeEach(() => {
  vi.clearAllMocks();
  transformHook = {} as NonNullable<ReturnType<typeof createTransformHook>>;
  watchChangeHook = {} as NonNullable<ReturnType<typeof createWatchChangeHook>>;
  configureServerHook = {} as NonNullable<ReturnType<typeof createConfigureServerHook>>;
  vi.mocked(loadCompilerOptions).mockReturnValue({ target: 99 });
  vi.mocked(createConfigureServerHook).mockReturnValue(configureServerHook);
  vi.mocked(createTransformHook).mockReturnValue(transformHook);
  vi.mocked(createWatchChangeHook).mockReturnValue(watchChangeHook);
});

describe('xaendarPlugin()', () => {
  it('builds a Vite plugin wiring the transform, watchChange and configureServer hooks', () => {
    const plugin = xaendarPlugin();

    expect(plugin.name).toBe('xaendar');
    expect(plugin.transform).toBe(transformHook);
    expect(plugin.watchChange).toBe(watchChangeHook);
    expect(plugin.configureServer).toBe(configureServerHook);
  });

  it('shares a single plugin state with a real NodeCompilerHost and the loaded compiler options across every hook', () => {
    xaendarPlugin();

    const stateArg = vi.mocked(createTransformHook).mock.calls[0][0];

    expect(stateArg.host).toBeInstanceOf(NodeCompilerHost);
    expect(stateArg.compilerOptions).toEqual({ target: 99 });
    expect(vi.mocked(createWatchChangeHook).mock.calls[0][0]).toBe(stateArg);
    expect(vi.mocked(createConfigureServerHook).mock.calls[0][0]).toBe(stateArg);
  });

  it('logs to the console when no logger has been set yet', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    xaendarPlugin();
    const state = vi.mocked(createTransformHook).mock.calls[0][0];
    state.logError(new Error('boom'), 'Something failed');

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('Xaendar: Something failed');

    consoleErrorSpy.mockRestore();
  });

  it('logs to the active logger once one has been set via setLogger', () => {
    xaendarPlugin();
    const state = vi.mocked(createTransformHook).mock.calls[0][0];
    const logger = { error: vi.fn() };

    state.setLogger(logger as unknown as Parameters<typeof state.setLogger>[0]);
    state.logError(new Error('boom'), 'Something failed');

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error.mock.calls[0][0]).toContain('Xaendar: Something failed');
  });

  it('falls back to an empty stack trace when the error is not an Error instance', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    xaendarPlugin();
    const state = vi.mocked(createTransformHook).mock.calls[0][0];
    state.logError('a plain string error', 'Something failed');

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('Xaendar: Something failed - a plain string error');

    consoleErrorSpy.mockRestore();
  });

  it('resets the logger back to unset, falling back to console again', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    xaendarPlugin();
    const state = vi.mocked(createTransformHook).mock.calls[0][0];
    const logger = { error: vi.fn() };

    state.setLogger(logger as unknown as Parameters<typeof state.setLogger>[0]);
    state.setLogger(undefined);
    state.logError(new Error('boom'), 'Something failed');

    expect(logger.error).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

    consoleErrorSpy.mockRestore();
  });
});
