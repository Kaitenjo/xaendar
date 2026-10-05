import type { HookHandler, Plugin } from 'vite';
import type { XaendarPluginState } from '../../types/plugin.types';

/**
 * Vite plugin `configResolved` hook: records whether the compiled styles must be minified,
 * which is the case in a production build whose CSS minification is not disabled.
 *
 * Styles are embedded in JS modules as strings, so the bundler's own CSS minification
 * never reaches them and the plugin has to minify them itself.
 *
 * @param state - The shared plugin state, whose `minifyStyles` flag is set.
 * @returns The `configResolved` hook handler.
 */
export function createConfigResolvedHook(state: XaendarPluginState): NonNullable<HookHandler<Plugin['configResolved']>> {
  return function configResolved(config) {
    state.minifyStyles = config.command === 'build' && config.build.cssMinify !== false;
  };
}
