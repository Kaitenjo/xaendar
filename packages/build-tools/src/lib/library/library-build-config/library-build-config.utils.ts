import type { InlineConfig, Plugin, PluginOption } from 'vite';
import { xaendarPlugin } from '../../plugin/plugin/plugin';
import type { LibraryAnalysis } from '../../types/library-analysis.type';
import type { LibraryPackageJson } from '../../types/library-package-json.type';
import type { LibraryBuild } from '../../types/library-build.type';

/**
 * Creates the matcher of the imports a library leaves to the application installing it: the Xaendar packages, which the
 * application provides once for every library (their module state is shared), and the packages the library depends on,
 * by their name or by a path of theirs.
 *
 * @param packageJson - The `package.json` of the library.
 * @returns Whether an import is left out of the build.
 */
export function createExternalMatcher(packageJson: LibraryPackageJson): (id: string) => boolean {
  const names = new Array<string>();
  addNames(names, packageJson.dependencies);
  addNames(names, packageJson.peerDependencies);
  return id => id.startsWith('@xaendar/') || names.some(name => id === name || id.startsWith(`${name}/`));
}

/**
 * Creates the configuration of Vite building a library, for the browser or, when it renders on the server, for the
 * server, into the folder `server` of its build: an ES module for its entry and one for each module declaring a
 * component or a directive, named after their path (`card/card.xd.component.js`), the code they share in `chunks`.
 * Nothing is minified but the stylesheets, and nothing of the machine building it (the ids of the modules) is written.
 *
 * @param library - The library.
 * @param plugins - The plugins running before the Xaendar plugin (Babel).
 * @param analysis - What the build reads of the sources of the library (see `analyzeLibrary`).
 * @param outDir - The folder of the build.
 * @param external - Tells the imports left out of the build (see {@link createExternalMatcher}).
 * @param server - Whether the configuration builds the library for the server.
 * @returns The configuration.
 */
export function createLibraryBuildConfig(library: LibraryBuild, plugins: readonly PluginOption[] | undefined, analysis: LibraryAnalysis, outDir: string, external: (id: string) => boolean, server: boolean): InlineConfig {
  const allPlugins = new Array<PluginOption>();
  if (plugins?.length) {
    for (let i = 0; i < plugins.length; i++) {
      allPlugins.push(plugins[i]);
    }
  }

  allPlugins.push(xaendarPlugin({ library }), createSideEffectsPlugin(analysis.modules));
  const config: InlineConfig = {
    configFile: false,
    root: library.root,
    plugins: allPlugins,
    build: {
      outDir: server ? `${outDir}/server` : outDir,
      emptyOutDir: true,
      copyPublicDir: false,
      minify: false,
      cssMinify: true,
      target: 'esnext',
      ssr: server,
      lib: { entry: analysis.entries, formats: ['es'] },
      rolldownOptions: {
        external,
        output: { entryFileNames: '[name].js', chunkFileNames: 'chunks/[hash].js' },
        experimental: { attachDebugInfo: 'none' }
      }
    }
  };

  // The packages the library imports and does not declare are part of its build, for the server too
  if (server) {
    config.ssr = { noExternal: true };
  }

  return config;
}

/**
 * Adds the names of some dependencies to a list.
 *
 * @param names - The list.
 * @param dependencies - The dependencies, by name, if any.
 */
function addNames(names: string[], dependencies: Record<string, string> | undefined): void {
  if (dependencies) {
    const keys = Object.keys(dependencies);
    for (let i = 0; i < keys.length; i++) {
      names.push(keys[i]);
    }
  }
}

/**
 * Creates the plugin keeping the modules declaring a component or a directive in the build whatever the `sideEffects` of
 * the `package.json` of the library say: their evaluation defines the component or the directive, and nothing reads
 * what they export.
 *
 * @param modules - The modules declaring a component or a directive, by absolute path.
 * @returns The plugin.
 */
function createSideEffectsPlugin(modules: ReadonlyMap<string, string>): Plugin {
  return {
    name: 'xaendar:library-side-effects',
    transform(code, id) {
      return modules.has(id) ? { code, moduleSideEffects: true } : undefined;
    }
  };
}
