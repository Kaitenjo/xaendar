import { clearSignalMembersCache } from '@xaendar/compiler';
import { disposeLanguageService } from '@xaendar/language-core';
import type { HookHandler, Plugin } from 'vite';
import { clearBaseClassRegistry } from '../../registry/base-class-registry/base-class-registry';
import { clearImportRegistry } from '../../registry/import-registry/import-registry';
import { clearMetadataRegistry } from '../../registry/metadata-registry/metadata-registry';
import { clearStyleRegistry } from '../../registry/style-registry/style-registry';
import { clearTemplateRegistry } from '../../registry/template-registry/template-registry';
import type { XaendarPluginState } from '../../types/plugin.types';

/**
 * Vite plugin `configureServer` hook: captures the dev server logger and, once the
 * HTTP server closes, clears every registry, the signal members cache and the
 * language service so a fresh dev server run starts from a clean state.
 *
 * @param state - The shared plugin state, whose logger is set on configure and reset on close.
 * @returns The `configureServer` hook handler.
 */
export function createConfigureServerHook(state: XaendarPluginState): NonNullable<HookHandler<Plugin['configureServer']>> {
  return function configureServer(server) {
    state.setLogger(server.config.logger);
    server.httpServer?.on('close', () => {
      clearTemplateRegistry();
      clearStyleRegistry();
      clearImportRegistry();
      clearMetadataRegistry();
      clearBaseClassRegistry();
      clearSignalMembersCache();
      disposeLanguageService();
      state.setLogger(undefined);
    });
  };
}