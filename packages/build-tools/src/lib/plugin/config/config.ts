import type { HookHandler, Plugin } from 'vite';
import type { XaendarPluginOptions } from '../../types/xaendar-plugin-options.type';

/**
 * Vite plugin `config` hook: when the plugin renders on the server, sets the application type of Vite to `custom`, so
 * that the dev server serves no `index.html` of its own and the page is rendered by the middleware of the plugin.
 *
 * @param options - The options of the plugin.
 * @returns The `config` hook handler.
 */
export function createConfigHook(options: XaendarPluginOptions): NonNullable<HookHandler<Plugin['config']>> {
  return function config() {
    return options.ssr ? { appType: 'custom' } : undefined;
  };
}
