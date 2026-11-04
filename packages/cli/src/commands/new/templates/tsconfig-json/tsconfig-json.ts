import type { ProjectRendering } from '../../types/project-rendering.type';

/**
 * Generates the content of the project `tsconfig.json`.
 *
 * Targets ES2026, uses `moduleResolution: bundler` for Vite compatibility,
 * and enables the strictest type-checking options available in TypeScript 6.
 * Several options that were non-default in earlier versions are now the
 * TypeScript 6 default and are therefore omitted.
 *
 * The rendering of the project adds its own compiler options after the ones of every project, and the files outside of
 * `src` it type-checks: for a project rendering its pages on the server, the types of Node and `server.ts`. No
 * `rootDir` is set, since nothing is emitted (`noEmit`) and it would reject those files.
 *
 * @param rendering - The rendering of the project, with its compiler options and the files it includes.
 * @returns The formatted JSON string.
 */
export function tsconfigJson(rendering: Pick<ProjectRendering, 'compilerOptions' | 'include'>): string {
  let options = '';
  if (rendering.compilerOptions) {
    for (const [name, value] of Object.entries(rendering.compilerOptions)) {
      options = `${options},\n    ${JSON.stringify(name)}: ${JSON.stringify(value)}`;
    }
  }

  let include = '"src/**/*.ts"';
  if (rendering.include?.length) {
    for (let i = 0; i < rendering.include.length; i++) {
      include = `${include}, ${JSON.stringify(rendering.include[i])}`;
    }
  }

  return `{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": [
      "ESNext",
      "DOM"
    ],
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "skipLibCheck": true,
    "paths": {
      "@/*": ["./src/*"]
    }${options}
  },
  "include": [${include}],
  "exclude": [
    "dist",
    "node_modules",
    "**/*.spec.ts"
  ]
}`;
}
