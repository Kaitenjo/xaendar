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

export function getProdViteConfig(name: string, dirName: string): UserConfig {
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
        external: (id) => external.some(pkg => id === pkg || id.startsWith(`${pkg}/`)),
      },
    },
    resolve: {
      preserveSymlinks: false
    },
    plugins: [
      {
        name: 'generate-package-json',
        writeBundle() {
          // Leggiamo il package.json originale della libreria
          const pkgPath = path.resolve(dirName, 'package.json');
          const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

          // Prepariamo la versione per la distribuzione
          const distPkg = {
            name: pkg.name,
            version: pkg.version,
            description: pkg.description,
            type: "module",
            main: `./${fileName}.es.js`,
            module: `./${fileName}.es.js`,
            exports: {
              ".": {
                import: `./${fileName}.es.js`
              }
            },
            peerDependencies: pkg.peerDependencies || {},
            dependencies: pkg.dependencies || {},
            // Copia altri campi utili come repository, author, license
          };

          writeFileSync(
            path.join(outDir, 'package.json'),
            JSON.stringify(distPkg, null, 2)
          );
        }
      },
      dts({
        insertTypesEntry: true,
        outDir,
        tsconfigPath: path.resolve(dirName, 'tsconfig.json'),
      }),
    ],
  };
}