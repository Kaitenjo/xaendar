import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { XaendarPluginState } from '../../types/plugin.types';

vi.mock('@xaendar/language-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xaendar/language-core')>();
  return {
    ...actual,
    disposeLanguageService: vi.fn()
  };
});

vi.mock('@xaendar/compiler', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xaendar/compiler')>();
  return {
    ...actual,
    clearSignalMembersCache: vi.fn()
  };
});

vi.mock('../../registry/base-class-registry/base-class-registry', () => ({
  clearBaseClassRegistry: vi.fn()
}));

vi.mock('../../registry/import-registry/import-registry', () => ({
  clearImportRegistry: vi.fn()
}));

vi.mock('../../registry/metadata-registry/metadata-registry', () => ({
  clearMetadataRegistry: vi.fn()
}));

vi.mock('../../registry/style-registry/style-registry', () => ({
  clearStyleRegistry: vi.fn()
}));

vi.mock('../../registry/template-registry/template-registry', () => ({
  clearTemplateRegistry: vi.fn()
}));

import { clearSignalMembersCache } from '@xaendar/compiler';
import { disposeLanguageService } from '@xaendar/language-core';
import { clearBaseClassRegistry } from '../../registry/base-class-registry/base-class-registry';
import { clearImportRegistry } from '../../registry/import-registry/import-registry';
import { clearMetadataRegistry } from '../../registry/metadata-registry/metadata-registry';
import { clearStyleRegistry } from '../../registry/style-registry/style-registry';
import { clearTemplateRegistry } from '../../registry/template-registry/template-registry';
import { createConfigureServerHook } from './configure-server';
import type { MinimalPluginContextWithoutEnvironment, ViteDevServer } from 'vite';

/**
 * Builds a fresh `XaendarPluginState` with mocked `setLogger`/`logError`, for a test to assert on.
 *
 * @returns The mocked plugin state.
 */
function createState(): XaendarPluginState {
  return {
    host: {} as XaendarPluginState['host'],
    compilerOptions: {} as XaendarPluginState['compilerOptions'],
    projectFileNames: [],
    minifyStyles: false,
    setLogger: vi.fn(),
    logError: vi.fn()
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createConfigureServerHook()', () => {
  it('sets the active logger from the server config', () => {
    const state = createState();
    const hook = createConfigureServerHook(state);
    const logger = { info: vi.fn() };

    hook.call({} as unknown as MinimalPluginContextWithoutEnvironment, { config: { logger }, httpServer: null } as unknown as ViteDevServer);

    expect(state.setLogger).toHaveBeenCalledWith(logger);
  });

  it('does nothing else when there is no httpServer (e.g. middleware mode)', () => {
    const state = createState();
    const hook = createConfigureServerHook(state);

    expect(() => {
      hook.call({} as unknown as MinimalPluginContextWithoutEnvironment, { config: { logger: {} }, httpServer: null } as unknown as ViteDevServer);
    }).not.toThrow();

    expect(clearTemplateRegistry).not.toHaveBeenCalled();
  });

  it('clears every registry, disposes the language service and resets the logger on server close', () => {
    const state = createState();
    const hook = createConfigureServerHook(state);
    const handlers: Record<string, () => void> = {};
    const httpServer = { on: vi.fn((event: string, cb: () => void) => { handlers[event] = cb; }) };

    hook.call({} as unknown as MinimalPluginContextWithoutEnvironment, { config: { logger: {} }, httpServer } as unknown as ViteDevServer);

    expect(httpServer.on).toHaveBeenCalledWith('close', expect.any(Function));

    handlers.close();

    expect(clearTemplateRegistry).toHaveBeenCalledTimes(1);
    expect(clearStyleRegistry).toHaveBeenCalledTimes(1);
    expect(clearImportRegistry).toHaveBeenCalledTimes(1);
    expect(clearMetadataRegistry).toHaveBeenCalledTimes(1);
    expect(clearBaseClassRegistry).toHaveBeenCalledTimes(1);
    expect(clearSignalMembersCache).toHaveBeenCalledTimes(1);
    expect(disposeLanguageService).toHaveBeenCalledTimes(1);
    expect(state.setLogger).toHaveBeenLastCalledWith(undefined);
  });
});
