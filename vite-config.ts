import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { UserConfig } from "vite";
import dts from 'vite-plugin-dts';

const external = [
  '@xendar/common',
  '@xendar/compiler',
  '@xendar/core',
  '@xendar/signals'
]

export default function getViteConfig(name: string, dirName: string): UserConfig {
  const fileName = name.split('/').join('-').slice(1);
  const outDir = path.resolve(dirName, `../../dist/${name}`);

  return {
    build: {
      target: 'esnext',
      lib: {
        entry: path.resolve(dirName, 'src/public-api.ts'),
        name,
        fileName: format => `${fileName}.${format}.js`,
        formats: ['es']
      },
      rollupOptions: {
        output: {
          dir: outDir
        },
        external
      },
      sourcemap: true,
    },
    resolve: {
      preserveSymlinks: false
    },
    plugins: [
      {
        name: 'generate-package-json',
        writeBundle() {
          const pkgPath = path.resolve(dirName, 'package.json');
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

          writeFileSync(
            path.join(outDir, 'package.json'),
            JSON.stringify(distPkg, null, 2)
          );
        }
      },
      dts({
        insertTypesEntry: true,
        rollupTypes: true,
        outDir,
        tsconfigPath: path.resolve(dirName, 'tsconfig.json'),
        bundledPackages: []
      }),
    ],
  };
}