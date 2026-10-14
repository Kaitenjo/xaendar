import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PackageJson } from 'type-fest';
import { PluginOption, UserConfig } from 'vite';
import dts from 'vite-plugin-dts';

/**
 * Options used to extend the shared Vite config.
 */
export type ViteConfigOptions = {
  plugins?: PluginOption[],
  secondaryEntryPoints?: Record<string, string>,
}

/**
 * Builds the standard Vite configuration for Xaendar packages.
 *
 * @param name Package name (for example, `@xaendar/core`).
 * @param dirName Absolute path of the package directory.
 * @param options Optional build extensions (plugins and secondary entry points).
 * @returns A reusable Vite user configuration.
 */
export default function getViteConfig(name: string, dirName: string, options?: ViteConfigOptions): UserConfig {
  const fileName = JSON.parse(JSON.stringify(name.split('/').join('-').slice(1)));
  const outDir = resolve(dirName, `../../dist/${name}`);
  const distDir = join(outDir, 'dist');
  const secondaryEntryPoints = options?.secondaryEntryPoints ?? {};
  const entry: Record<string, string> = { [fileName]: resolve(dirName, 'src/public-api.ts') };
  for (const [entryPoint, path] of Object.entries(secondaryEntryPoints)) {
    entry[entryPoint] = resolve(dirName, path);
  }

  const plugins: PluginOption[] = [
    createGeneratePackageJsonPlugin(dirName, fileName, outDir, secondaryEntryPoints),
    createCopyReadmePlugin(dirName, outDir),
    dts({
      exclude: [`**/packages/${fileName.split('-')[1]}/**/*.spec.ts`],
      include: [
        `**/packages/${fileName.split('-')[1]}/**/*.ts`,
        '**/packages/signals/**/global.d.ts'
      ],
      bundleTypes: true,
      outDirs: distDir,
      root: resolve(dirName, 'src'),
      afterBuild() {
        const pkgImportRegex = /from (['"])(?:\.\.\/)*([^/'"]+)\/src\/public-api\1/g;
        const dts = readdirSync(distDir, { recursive: true, encoding: 'utf-8' }).filter(entry => entry.endsWith('.d.ts')).map((entry) => join(distDir, entry));
        for (const filePath of dts) {
          const content = readFileSync(filePath, 'utf-8');
          const result = content.replace(pkgImportRegex, (_match, quote, pkg) => `from ${quote}@xaendar/${pkg}${quote}`);

          console.log(result === content, filePath);
          if (result !== content) {
            writeFileSync(filePath, result);
          }
        }
      }
    })
  ];
  if (options?.plugins?.length) {
    plugins.push(...options.plugins);
  }

  return {
    build: {
      target: 'esnext',
      lib: {
        entry,
        name,
        fileName: (_, entryName) => `${entryName}.js`,
        formats: ['es']
      },
      outDir: distDir,
      emptyOutDir: true,
      rollupOptions: {
        external: [
          '@xaendar/common',
          '@xaendar/compiler',
          '@xaendar/core',
          '@xaendar/signals',
          '@xaendar/types',
          'typescript'
        ]
      },
      minify: false,
      sourcemap: false
    },
    logLevel: 'info',
    plugins
  };
}

/**
 * Creates the plugin that writes the distribution `package.json`.
 *
 * @param dirName Absolute path of the current package directory.
 * @param fileName Output file name derived from the package name.
 * @param outDir Output root directory for the package.
 * @param secondaryEntryPoints Additional export entry points.
 * @returns A Vite plugin that generates `package.json` in the output folder.
 */
function createGeneratePackageJsonPlugin(dirName: string, fileName: string, outDir: string, secondaryEntryPoints: Record<string, string>): PluginOption {
  return {
    name: 'generate-package-json',
    writeBundle() {
      const pkgPath = resolve(dirName, 'package.json');
      const pkg: PackageJson = JSON.parse(readFileSync(pkgPath, 'utf-8'));

      const exports: PackageJson.ExportConditions = {
        '.': {
          import: {
            types: `./dist/${fileName}.d.ts`,
            default: `./dist/${fileName}.js`
          }
        }
      };
      for (const entryPoint of Object.keys(secondaryEntryPoints)) {
        exports[`./${entryPoint}`] = {
          import: {
            types: `./dist/${entryPoint}.d.ts`,
            default: `./dist/${entryPoint}.js`
          }
        };
      }

      const distPkg: Record<string, unknown> = {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
        sideEffects: false,
        type: 'module',
        main: `./dist/${fileName}.js`,
        module: `./dist/${fileName}.js`,
        types: `./dist/${fileName}.d.ts`,
        exports
      };

      const { peerDependencies, dependencies } = pkg;
      if (peerDependencies && Object.keys(peerDependencies).length) {
        distPkg.peerDependencies = peerDependencies;
      }

      if (dependencies && Object.keys(dependencies).length) {
        distPkg.dependencies = dependencies;
      }

      mkdirSync(outDir, { recursive: true });
      writeFileSync(join(outDir, 'package.json'), JSON.stringify(distPkg, null, 2));
    }
  };
}

/**
 * Creates the plugin that copies package `README.md` to the output folder.
 *
 * @param dirName Absolute path of the current package directory.
 * @param outDir Output root directory for the package.
 * @returns A Vite plugin that copies `README.md` if present.
 */
function createCopyReadmePlugin(dirName: string, outDir: string): PluginOption {
  return {
    name: 'copy-readme',
    writeBundle() {
      const readmePath = resolve(dirName, 'README.md');
      if (existsSync(readmePath)) {
        copyFileSync(readmePath, resolve(outDir, 'README.md'));
      }
    }
  };
}