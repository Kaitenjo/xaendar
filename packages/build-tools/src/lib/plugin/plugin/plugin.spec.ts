import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@xaendar/language-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xaendar/language-core')>();
  return {
    ...actual,
    loadTsConfig: vi.fn()
  };
});

vi.mock('../build-end/build-end', () => ({
  createBuildEndHook: vi.fn()
}));

vi.mock('../config-resolved/config-resolved', () => ({
  createConfigResolvedHook: vi.fn()
}));

vi.mock('../configure-server/configure-server', () => ({
  createConfigureServerHook: vi.fn()
}));

vi.mock('../hot-update/hot-update', () => ({
  createHotUpdateHook: vi.fn()
}));

vi.mock('../load/load', () => ({
  createLoadHook: vi.fn()
}));

vi.mock('../resolve-id/resolve-id', () => ({
  createResolveIdHook: vi.fn()
}));

vi.mock('../transform/transform', () => ({
  createTransformHook: vi.fn()
}));

vi.mock('../watch-change/watch-change', () => ({
  createWatchChangeHook: vi.fn()
}));

import { loadTsConfig } from '@xaendar/language-core';
import { CLIENT_STRATEGY, SERVER_STRATEGY } from '../../costants/plugin-strategies';
import { NodeCompilerHost } from '../../models/node-compiler-host/node-compiler-host.model';
import { createBuildEndHook } from '../build-end/build-end';
import { createConfigResolvedHook } from '../config-resolved/config-resolved';
import { createConfigureServerHook } from '../configure-server/configure-server';
import { createHotUpdateHook } from '../hot-update/hot-update';
import { createLoadHook } from '../load/load';
import { createResolveIdHook } from '../resolve-id/resolve-id';
import { createTransformHook } from '../transform/transform';
import { createWatchChangeHook } from '../watch-change/watch-change';
import { xaendarPlugin } from './plugin';

/**
 * Mocked `resolveId` hook handler returned by `createResolveIdHook`.
 */
let resolveIdHook: NonNullable<ReturnType<typeof createResolveIdHook>>;

/**
 * Mocked `load` hook handler returned by `createLoadHook`.
 */
let loadHook: NonNullable<ReturnType<typeof createLoadHook>>;

/**
 * Mocked `transform` hook handler returned by `createTransformHook`.
 */
let transformHook: NonNullable<ReturnType<typeof createTransformHook>>;

/**
 * Mocked `watchChange` hook handler returned by `createWatchChangeHook`.
 */
let watchChangeHook: NonNullable<ReturnType<typeof createWatchChangeHook>>;

/**
 * Mocked `hotUpdate` hook handler returned by `createHotUpdateHook`.
 */
let hotUpdateHook: NonNullable<ReturnType<typeof createHotUpdateHook>>;

/**
 * Mocked `configureServer` hook handler returned by `createConfigureServerHook`.
 */
let configureServerHook: NonNullable<ReturnType<typeof createConfigureServerHook>>;

/**
 * Mocked `buildEnd` hook handler returned by `createBuildEndHook`.
 */
let buildEndHook: NonNullable<ReturnType<typeof createBuildEndHook>>;

/**
 * Mocked `configResolved` hook handler returned by `createConfigResolvedHook`.
 */
let configResolvedHook: NonNullable<ReturnType<typeof createConfigResolvedHook>>;

beforeEach(() => {
  vi.clearAllMocks();
  resolveIdHook = {} as NonNullable<ReturnType<typeof createResolveIdHook>>;
  loadHook = {} as NonNullable<ReturnType<typeof createLoadHook>>;
  transformHook = {} as NonNullable<ReturnType<typeof createTransformHook>>;
  watchChangeHook = {} as NonNullable<ReturnType<typeof createWatchChangeHook>>;
  hotUpdateHook = {} as NonNullable<ReturnType<typeof createHotUpdateHook>>;
  configureServerHook = {} as NonNullable<ReturnType<typeof createConfigureServerHook>>;
  configResolvedHook = {} as NonNullable<ReturnType<typeof createConfigResolvedHook>>;
  vi.mocked(createConfigResolvedHook).mockReturnValue(configResolvedHook);
  buildEndHook = {} as NonNullable<ReturnType<typeof createBuildEndHook>>;
  vi.mocked(createBuildEndHook).mockReturnValue(buildEndHook);
  vi.mocked(loadTsConfig).mockReturnValue({ options: { target: 99 }, fileNames: ['/project/src/globals.d.ts'] });
  vi.mocked(createConfigureServerHook).mockReturnValue(configureServerHook);
  vi.mocked(createResolveIdHook).mockReturnValue(resolveIdHook);
  vi.mocked(createLoadHook).mockReturnValue(loadHook);
  vi.mocked(createTransformHook).mockReturnValue(transformHook);
  vi.mocked(createWatchChangeHook).mockReturnValue(watchChangeHook);
  vi.mocked(createHotUpdateHook).mockReturnValue(hotUpdateHook);
});

describe('xaendarPlugin()', () => {
  it('builds a Vite plugin wiring the config, configResolved, resolveId, load, transform, buildEnd, watchChange, hotUpdate and configureServer hooks', () => {
    const plugin = xaendarPlugin();

    expect(plugin.name).toBe('xaendar');
    expect(plugin.config).toEqual(expect.any(Function));
    expect(plugin.configResolved).toBe(configResolvedHook);
    expect(plugin.resolveId).toBe(resolveIdHook);
    expect(plugin.load).toBe(loadHook);
    expect(plugin.transform).toBe(transformHook);
    expect(plugin.buildEnd).toBe(buildEndHook);
    expect(plugin.watchChange).toBe(watchChangeHook);
    expect(plugin.hotUpdate).toBe(hotUpdateHook);
    expect(plugin.configureServer).toBe(configureServerHook);
  });

  it('shares a single plugin state with a real NodeCompilerHost and the loaded tsconfig across every hook', () => {
    xaendarPlugin();

    const stateArg = vi.mocked(createTransformHook).mock.calls[0][0];

    expect(stateArg.host).toBeInstanceOf(NodeCompilerHost);
    expect(loadTsConfig).toHaveBeenCalledWith(process.cwd());
    expect(stateArg.compilerOptions).toEqual({ target: 99 });
    expect(stateArg.projectFileNames).toEqual(['/project/src/globals.d.ts']);
    expect(vi.mocked(createLoadHook).mock.calls[0][0]).toBe(stateArg);
    expect(vi.mocked(createWatchChangeHook).mock.calls[0][0]).toBe(stateArg);
    expect(vi.mocked(createConfigureServerHook).mock.calls[0][0]).toBe(stateArg);
    expect(vi.mocked(createConfigResolvedHook).mock.calls[0][0]).toBe(stateArg);
    expect(vi.mocked(createBuildEndHook).mock.calls[0][0]).toBe(stateArg);
    expect(vi.mocked(createHotUpdateHook).mock.calls[0][0]).toBe(stateArg);
  });

  it('stores the patterns of the custom elements of other libraries in the state, none by default', () => {
    xaendarPlugin({ customElements: ['sl-*'] });
    xaendarPlugin();

    expect(vi.mocked(createTransformHook).mock.calls[0][0].customElements).toEqual(['sl-*']);
    expect(vi.mocked(createTransformHook).mock.calls[1][0].customElements).toEqual([]);
  });

  it('stores the rendering on the server in the state, none by default', () => {
    xaendarPlugin({ ssr: { entry: 'src/entry-server.ts' } });
    xaendarPlugin();

    expect(vi.mocked(createTransformHook).mock.calls[0][0].ssr).toEqual({ entry: 'src/entry-server.ts' });
    expect(vi.mocked(createTransformHook).mock.calls[1][0].ssr).toBeUndefined();
  });

  it('gives the server the strategy of the server rendering only with ssr, the browser always its own', () => {
    xaendarPlugin({ ssr: { entry: 'src/entry-server.ts' } });
    xaendarPlugin();

    const [rendering, browserOnly] = vi.mocked(createTransformHook).mock.calls.map(call => call[0].strategies);
    expect(rendering.client).toBe(CLIENT_STRATEGY);
    expect(rendering.server).toBe(SERVER_STRATEGY);
    expect(browserOnly.client).toBe(CLIENT_STRATEGY);
    expect(browserOnly.server).toBe(CLIENT_STRATEGY);
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
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('Xaendar: Something failed\na plain string error');

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
