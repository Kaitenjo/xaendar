import { build } from 'vite';
import { createPlugins } from '../plugins';
import { readXaendarConfig, resolveSsrPaths } from '../xaendar-config/xaendar-config.utils';

/**
 * Builds the project with the shared plugins: the application for the browser, as its Vite configuration declares it,
 * then, when the `xaendar.json` declares the rendering on the server, its entry for the server, into the folder of the
 * build of the server. The dependencies of the server build stay imports of the packages, so that the server loads a
 * single copy of `@xaendar/core`, the one of the project.
 *
 * @param staticReport - Whether the build tells what keeps each interactive component in the bundle of the browser.
 * @returns A promise resolving once the project is built.
 */
export async function buildProject(staticReport?: boolean): Promise<void> {
  await build({ plugins: createPlugins(staticReport) });

  const ssr = readXaendarConfig()?.ssr;
  if (!ssr) {
    return;
  }

  const { entry, outDir } = resolveSsrPaths(ssr);
  await build({
    plugins: createPlugins(),
    build: { ssr: entry, outDir, emptyOutDir: true, copyPublicDir: false }
  });
}
