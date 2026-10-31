import type { HookHandler, Plugin } from 'vite';

/**
 * The function handling the `load` hook of a Vite plugin.
 */
export type LoadHook = NonNullable<HookHandler<Plugin['load']>>;
