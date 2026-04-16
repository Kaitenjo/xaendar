import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { PluginOption, UserConfig } from "vite";
import dts from 'vite-plugin-dts';

export type ViteConfigOptions = {
  plugins?: PluginOption[]
}

const external = [
  '@xaendar/common',
  '@xaendar/compiler',
  '@xaendar/core',
  '@xaendar/signals'
]

export default function getViteConfig(name: string, dirName: string, options?: ViteConfigOptions): UserConfig {
  const fileName = name.split('/').join('-').slice(1);
  const outDir = resolve(dirName, `../../dist/${name}`);

  return {
    build: {
      target: 'esnext',
      lib: {
        entry: resolve(dirName, 'src/public-api.ts'),
        name,
        fileName: format => `${fileName}.${format}.js`,
        formats: ['es']
      },
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          dir: outDir
        },
        external
      },
      sourcemap: true,
    },
    logLevel: 'info',
    plugins: [
      {
        name: 'generate-package-json',
        writeBundle() {
          const pkgPath = resolve(dirName, 'package.json');
          const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

          const distPkg = {
            name: pkg.name,
            version: pkg.version,
            description: pkg.description,
            type: "module",
            main: `./${fileName}.es.js`,
            module: `./${fileName}.es.js`,
            types: `./${fileName}.es.d.ts`,
            exports: {
              ".": {
                import: `./${fileName}.es.js`,
                types: `./${fileName}.es.d.ts`
              }
            },
            peerDependencies: pkg.peerDependencies || {},
            dependencies: pkg.dependencies || {}
          };
          writeFileSync(join(outDir, 'package.json'), JSON.stringify(distPkg, null, 2));
        }
      },
      dts({
        rollupTypes: true,
        outDir,
        root: resolve(dirName, 'src/public-api.ts'),
        afterBuild() {
          const typesPath = resolve(outDir, `${fileName}.es.d.ts`);
          const content = readFileSync(typesPath, 'utf-8')
          const result = content.replace(/from ['"](?:\.\.\/)*schematics\/packages\/([^/]+)\/src\/public-api['"]/g, (_, pkg) => `from '@xaendar/${pkg}'`);
          writeFileSync(typesPath, result);
        }
      }),
      ...(options?.plugins ?? [])
    ],
  };
}