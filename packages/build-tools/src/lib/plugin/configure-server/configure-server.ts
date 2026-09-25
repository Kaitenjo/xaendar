import { disposeLanguageService } from '@xaendar/language-core';
import type { HookHandler, Plugin } from 'vite';
import { clearImportRegistry } from '../../registry/import-registry/import-registry';
import { clearMetadataRegistry } from '../../registry/metadata-registry/metadata-registry';
import { clearStyleRegistry } from '../../registry/style-registry/style-registry';
import { clearTemplateRegistry } from '../../registry/template-registry/template-registry';
import type { XaendarPluginState } from '../../types/plugin.types';

export function createConfigureServerHook(state: XaendarPluginState): NonNullable<HookHandler<Plugin['configureServer']>> {
  return function configureServer(server) {
    state.setLogger(server.config.logger);
    server.httpServer?.on('close', () => {
      clearTemplateRegistry();
      clearStyleRegistry();
      clearImportRegistry();
      clearMetadataRegistry();
      disposeLanguageService();
      state.setLogger(undefined);
    });
  };
}