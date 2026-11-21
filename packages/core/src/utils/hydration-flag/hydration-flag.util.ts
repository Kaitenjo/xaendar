/**
 * Whether the application is rendered on the server, written by the plugin of `@xaendar/build-tools` in place of the
 * identifier (the `define` of Vite): `true` when `xaendar.json` declares `ssr`, `false` otherwise. Nothing defines it
 * where the code of core is not bundled by the plugin, as in the tests and on the server.
 */
declare const __XAENDAR_HYDRATION__: boolean | undefined;

/**
 * Whether the runtime hydrates what the server rendered: `false` only in an application bundled by the plugin of
 * `@xaendar/build-tools` without `ssr` in `xaendar.json`, where no element comes from the server. The code adopting the
 * nodes of the server, waiting for the triggers of the hydration, replaying the events recorded meanwhile and reading the
 * state the server transferred runs only under it, so that the bundler leaves it out of such an application; where
 * nothing defines {@link __XAENDAR_HYDRATION__}, it is `true`, and the runtime hydrates.
 *
 * N.B. Deliberate: an expression of the identifier the bundler replaces, exported as a constant, which the bundler then
 * folds into `false` and inlines in the conditions reading it, dropping the code they guard and the modules only that code
 * imports. Do not read it through a function: the bundler would no longer see a constant, and the hydration would stay
 * in every bundle.
 */
export const HYDRATION = typeof __XAENDAR_HYDRATION__ !== 'boolean' || __XAENDAR_HYDRATION__;
