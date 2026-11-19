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
 * Whether the application runs in development (see {@link readDevMode}), read once, when the module is evaluated.
 */
export const DEV_MODE = readDevMode();
