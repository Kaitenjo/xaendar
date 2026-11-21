/**
 * The `process` of Node, as far as {@link readDevMode} reads it: the bundlers replace `process.env.NODE_ENV` as it is
 * written, so it is read through the global, declared here for the projects compiling the sources of core without the
 * types of Node. It may not exist at all, as in a browser.
 */
declare const process: { readonly env: { readonly NODE_ENV?: string } };

/**
 * Tells whether the application runs in development, where the runtime checks what only a mistake of the runtime or of
 * the compiled code can break: anywhere `process.env.NODE_ENV` is not `production`. The bundlers write `production` in
 * its place in a build for production (Vite, esbuild, webpack), so that the checks cost nothing there; where nothing
 * defines it, as in a page loading the modules without a bundler, the checks run.
 *
 * @returns `true` in development.
 */
export function readDevMode(): boolean {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    // No bundler defined it, and there is no `process`: nothing tells it is a build for production
    return true;
  }
}

/**
 * Whether the application runs in development, written by the plugin of `@xaendar/build-tools` in place of the
 * identifier (the `define` of Vite): `false` in a build for production. Nothing defines it where the code of core is
 * not bundled by the plugin, as in the tests and on the server.
 */
declare const __XAENDAR_DEV__: boolean | undefined;

/**
 * Whether the application runs in development: as the plugin of `@xaendar/build-tools` defines it, or else as
 * {@link readDevMode} tells, read once, when the module is evaluated.
 *
 * N.B. Deliberate: the identifier the plugin replaces is read before {@link readDevMode}, so that the bundler folds the
 * constant into `false` in a build for production and drops the checks it guards, and the function with them; read
 * through the function alone, the checks stay in every bundle. Do not read it only through `readDevMode`.
 */
export const DEV_MODE = typeof __XAENDAR_DEV__ === 'boolean' ? __XAENDAR_DEV__ : readDevMode();
